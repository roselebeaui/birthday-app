const messages = [];

module.exports = async function (context, req) {
  const method = (req.method || 'GET').toUpperCase();

  // Allow simple CORS for local dev
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  };

  if (method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  if (method === 'GET') {
    context.res = { status: 200, headers, body: { messages } };
    return;
  }

  if (method === 'POST') {
    const { text } = req.body || {};
    const trimmed = (text || '').trim();
    if (!trimmed) {
      context.res = { status: 400, headers, body: { error: 'Message text required' } };
      return;
    }
    const item = { id: Date.now(), text: trimmed };
    messages.unshift(item);
    if (messages.length > 200) messages.length = 200;
    context.res = { status: 201, headers, body: item };
    return;
  }

  context.res = { status: 405, headers, body: { error: 'Method not allowed' } };
};
