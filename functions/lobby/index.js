const { TableClient, AzureNamedKeyCredential } = require('@azure/data-tables')

module.exports = async function (context, req) {
  const origin = req.headers && (req.headers.origin || req.headers.Origin) || '*'
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: cors(origin) }
    return
  }
  try {
    const body = req.body || {}
    const lobbyCode = (body.lobbyCode || '').toUpperCase()
    const leaderId = body.leaderId || ''
    const leaderName = body.leaderName || ''
    const color = body.color || '#4f46e5'
    const status = (body.status || 'open').toLowerCase() // open | started | closed
    const playersCount = Number.isFinite(body.playersCount) ? body.playersCount : 1

    if (!lobbyCode) return bad(context, origin, 'lobbyCode required')

    const { accountName, accountKey, tableName } = getStorageConfig()
    const client = new TableClient(`https://${accountName}.table.core.windows.net`, tableName, new AzureNamedKeyCredential(accountName, accountKey))
    try { await client.createTable() } catch {}

    const now = new Date().toISOString()
    const entity = {
      partitionKey: 'lobby',
      rowKey: lobbyCode,
      leaderId,
      leaderName,
      color,
      status,
      playersCount,
      updatedAt: now,
      createdAt: now
    }

    // Upsert merges for updates
    await client.upsertEntity(entity, 'Merge')

    context.res = { status: 200, headers: { 'Content-Type': 'application/json', ...cors(origin) }, body: JSON.stringify({ ok: true }) }
  } catch (err) {
    context.log('lobby upsert error', err)
    context.res = { status: 500, headers: cors('*'), body: 'Failed to upsert lobby' }
  }
}

function bad(context, origin, msg) {
  context.res = { status: 400, headers: cors(origin), body: msg }
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
  const conn = process.env.AzureWebJobsStorage || process.env.AZURE_WEBJOBS_STORAGE
  const tableName = process.env.LOBBY_TABLE || 'lobbies'
  if (!conn) throw new Error('AzureWebJobsStorage not configured')
  const accountMatch = conn.match(/AccountName=([^;]+)/i)
  const keyMatch = conn.match(/AccountKey=([^;]+)/i)
  if (!accountMatch || !keyMatch) throw new Error('Invalid storage connection string')
  return { accountName: accountMatch[1], accountKey: keyMatch[1], tableName }
}
