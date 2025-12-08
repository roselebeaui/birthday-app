const { TableClient, AzureSASCredential } = require('@azure/data-tables');

// Use AzureWebJobsStorage when running in Azure; allow override via MESSAGE_TABLE_CONNECTION and MESSAGE_TABLE_NAME
const TABLE_NAME = process.env.MESSAGE_TABLE_NAME || 'BirthdayMessages';

let tableClientPromise;
async function getTableClient(context) {
  if (!tableClientPromise) {
    tableClientPromise = (async () => {
      // Prefer AzureWebJobsStorage; if missing, allow SAS-based endpoint via MESSAGE_TABLE_URL + MESSAGE_TABLE_SAS
      const connection = process.env.AzureWebJobsStorage || process.env.MESSAGE_TABLE_CONNECTION;
      if (connection) {
        const client = TableClient.fromConnectionString(connection, TABLE_NAME);
        await client.createTable({ onResponse: () => {} }).catch(() => {});
        return client;
      }
      const url = process.env.MESSAGE_TABLE_URL;
      const sas = process.env.MESSAGE_TABLE_SAS;
      if (url && sas) {
        const client = new TableClient(url, TABLE_NAME, new AzureSASCredential(sas));
        await client.createTable({ onResponse: () => {} }).catch(() => {});
        return client;
      }
      context.log.warn('No table storage configured. Falling back to volatile memory.');
      return null;
    })();
  }
  return tableClientPromise;
}

// Volatile fallback if storage not configured
const volatile = [];

module.exports = async function (context, req) {
  const method = (req.method || 'GET').toUpperCase();

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  };

  if (method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  const client = await getTableClient(context);

  if (method === 'GET') {
    if (!client) {
      context.res = { status: 200, headers, body: { messages: volatile } };
      return;
    }
    const messages = [];
    const iter = client.listEntities({ queryOptions: { filter: `PartitionKey eq 'birthday'` } });
    for await (const entity of iter) {
      messages.push({ id: entity.rowKey, text: entity.text, createdAt: entity.createdAt });
    }
    messages.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')); // newest first
    context.res = { status: 200, headers, body: { messages: messages.slice(0, 200) } };
    return;
  }

  if (method === 'POST') {
    const { text } = req.body || {};
    const trimmed = (text || '').trim();
    if (!trimmed) {
      context.res = { status: 400, headers, body: { error: 'Message text required' } };
      return;
    }
    const now = new Date();
    const rowKey = `${now.getTime()}_${Math.random().toString(36).slice(2, 6)}`;
    const item = { id: rowKey, text: trimmed, createdAt: now.toISOString() };

    if (!client) {
      volatile.unshift(item);
      if (volatile.length > 500) volatile.length = 500;
      context.res = { status: 201, headers, body: item };
      return;
    }
    await client.upsertEntity({
      partitionKey: 'birthday',
      rowKey,
      text: trimmed,
      createdAt: item.createdAt,
    }, 'Merge');
    context.res = { status: 201, headers, body: item };
    return;
  }

  context.res = { status: 405, headers, body: { error: 'Method not allowed' } };
};
