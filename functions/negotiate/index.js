const { WebPubSubServiceClient } = require('@azure/web-pubsub')

module.exports = async function (context, req) {
  // Basic CORS support
  const origin = req.headers && (req.headers.origin || req.headers.Origin) || '*'
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Max-Age': '86400'
      }
    }
    return
  }

  try {
    const connectionString = process.env.WebPubSubConnectionString || process.env.WEB_PUBSUB_CONNECTION_STRING
    if (!connectionString) {
      context.res = {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': origin },
        body: 'Missing WebPubSubConnectionString app setting'
      }
      return
    }

    const hub = (req.query && req.query.hub) || (req.body && req.body.hub) || 'lobby'
    let userId = (req.query && req.query.userId) || (req.body && req.body.userId)
    if (!userId) {
      userId = req.headers['x-ms-client-principal-id'] || req.headers['x-ms-client-principal-name'] || `guest-${Math.random().toString(36).slice(2, 10)}`
    }

    const serviceClient = new WebPubSubServiceClient(connectionString, hub)
    const token = await serviceClient.getClientAccessToken({
      userId,
      // Broad roles for MVP; you can scope to specific groups if desired
      roles: ['webpubsub.sendToGroup', 'webpubsub.joinLeaveGroup']
    })

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin
      },
      body: { url: token.url }
    }
  } catch (err) {
    context.log('Negotiate error', err)
    context.res = {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Failed to generate client access URL'
    }
  }
}
