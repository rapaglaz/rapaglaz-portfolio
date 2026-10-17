const ALLOWED_ORIGINS = [
  'https://rapaglaz.de',
  'https://www.rapaglaz.de',
  'https://rapaglaz.github.io',
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  'http://localhost:4233',
  'http://127.0.0.1:4233',
];

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

function corsHeaders(origin) {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
    };
  }
  return {};
}

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      if (origin && !ALLOWED_ORIGINS.includes(origin)) {
        return jsonResponse({ error: 'Forbidden' }, 403);
      }

      return new Response(null, {
        status: 204,
        headers: {
          ...cors,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const parts = url.pathname.split('/').filter(Boolean);

    if (parts.length !== 2 || parts[0] !== 'feature-flag') {
      return new Response('Not Found', { status: 404, headers: cors });
    }

    if (request.method !== 'GET') {
      return jsonResponse({ error: 'Method Not Allowed' }, 405, { ...cors, Allow: 'GET, OPTIONS' });
    }

    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    const flagName = decodeURIComponent(parts[1] || '').trim();
    if (flagName.length === 0) {
      return jsonResponse({ error: 'Invalid flag name' }, 400, cors);
    }

    try {
      const stored = await env.KV.get(flagName);
      if (stored === null) {
        return jsonResponse({ error: 'Flag not found' }, 404, cors);
      }

      if (stored !== 'true' && stored !== 'false') {
        return jsonResponse({ error: 'Invalid flag value' }, 400, cors);
      }

      return jsonResponse({ [flagName]: stored === 'true' }, 200, cors);
    } catch {
      return jsonResponse({ error: 'Internal Server Error' }, 500, cors);
    }
  },
};
