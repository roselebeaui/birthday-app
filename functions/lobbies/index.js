const { TableClient, AzureNamedKeyCredential } = require('@azure/data-tables')

module.exports = async function (context, req) {
  const origin = req.headers && (req.headers.origin || req.headers.Origin) || '*'
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: cors(origin) }
    return
  }
  try {
    const { accountName, accountKey, tableName } = getStorageConfig()
    const client = new TableClient(`https://${accountName}.table.core.windows.net`, tableName, new AzureNamedKeyCredential(accountName, accountKey))
    // Ensure table exists
    try { await client.createTable() } catch {}

    const ttlMinutes = parseInt(process.env.LOBBY_TTL_MINUTES || '30', 10)
    const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000).toISOString()
    const filter = `PartitionKey eq 'lobby' and status eq 'open' and updatedAt ge '${cutoff}'`

    const results = []
    for await (const entity of client.listEntities({ queryOptions: { filter } })) {
      results.push({
        lobbyCode: entity.rowKey,
        leaderId: entity.leaderId,
        leaderName: entity.leaderName,
        color: entity.color,
        playersCount: entity.playersCount || 1,
        status: entity.status,
        updatedAt: entity.updatedAt,
        createdAt: entity.createdAt
      })
    }

    context.res = { status: 200, headers: { 'Content-Type': 'application/json', ...cors(origin) }, body: JSON.stringify({ lobbies: results }) }
  } catch (err) {
    context.log('lobbies error', err)
    context.res = { status: 500, headers: cors('*'), body: 'Failed to list lobbies' }
  }
}

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400'
  }
}

function getStorageConfig() {
  // Parse AzureWebJobsStorage for account/key when using connection string
  const conn = process.env.AzureWebJobsStorage || process.env.AZURE_WEBJOBS_STORAGE
  const tableName = process.env.LOBBY_TABLE || 'lobbies'
  if (!conn) throw new Error('AzureWebJobsStorage not configured')
  const accountMatch = conn.match(/AccountName=([^;]+)/i)
  const keyMatch = conn.match(/AccountKey=([^;]+)/i)
  if (!accountMatch || !keyMatch) throw new Error('Invalid storage connection string')
  return { accountName: accountMatch[1], accountKey: keyMatch[1], tableName }
}
