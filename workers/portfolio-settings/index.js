/**
 * Config Worker: serves the public Turnstile site key on GET or HEAD /config.
 */

// --- Constants ---
const CONFIG = {
  TURNSTILE_SITE_KEY: '0x4AAAAAAB98Vx1r87KQ9OmN',
  VERSION: '1.0.0',
  CACHE_MAX_AGE: 300, // 5 minutes
  CORS_MAX_AGE: '600',
  ALLOWED_PROD_HOSTS: ['rapaglaz.de', 'www.rapaglaz.de'],
};

const ALLOWED_ORIGINS = [
  'https://rapaglaz.de',
  'https://www.rapaglaz.de',
  'https://rapaglaz.github.io',
];

export default {
  async fetch(request) {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      const url = new URL(request.url);
      const hostname = url.hostname;
      const origin = request.headers.get('Origin');
      const method = request.method;

      // Logging context
      const logCtx = {
        requestId,
        method,
        pathname: url.pathname,
        hostname,
        origin,
      };

      // --- Host pinning ---
      if (!CONFIG.ALLOWED_PROD_HOSTS.includes(hostname)) {
        logWarn('Forbidden host', logCtx);
        return new Response('Forbidden host', { status: 403 });
      }

      // --- Path validation ---
      if (url.pathname !== '/config') {
        logInfo('Endpoint not found', logCtx);
        return new Response('Not Found', { status: 404 });
      }

      // --- CORS: allow localhost + whitelisted origins ---
      const isOriginAllowed =
        Boolean(origin) && (ALLOWED_ORIGINS.includes(origin) || isLocalOrigin(origin));

      // --- Preflight (OPTIONS) ---
      if (method === 'OPTIONS') {
        const headers = {
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': CONFIG.CORS_MAX_AGE,
          Vary: 'Origin',
          'X-Content-Type-Options': 'nosniff',
        };

        if (isOriginAllowed) {
          headers['Access-Control-Allow-Origin'] = origin;
        }

        logInfo('CORS preflight handled', { ...logCtx, allowed: isOriginAllowed });

        return new Response(null, {
          status: 204,
          headers,
        });
      }

      // --- Method restrictions ---
      if (method !== 'GET' && method !== 'HEAD') {
        logWarn('Method not allowed', logCtx);
        return new Response('Method Not Allowed', { status: 405 });
      }

      // --- Response payload ---
      const payload = {
        turnstileSiteKey: CONFIG.TURNSTILE_SITE_KEY,
        version: CONFIG.VERSION,
      };
      const body = JSON.stringify(payload);

      // --- Deterministic ETag ---
      const etag = await sha256Etag(body);
      const inm = request.headers.get('If-None-Match') ?? '';

      // Handle 304 Not Modified; If-None-Match may list several ETags
      if (inm.split(',').some(tag => tag.trim() === etag)) {
        const headers = {
          ETag: etag,
          'Cache-Control': `public, max-age=${CONFIG.CACHE_MAX_AGE}`,
          Vary: 'Origin',
          'Access-Control-Expose-Headers': 'ETag, Cache-Control',
        };

        if (isOriginAllowed) {
          headers['Access-Control-Allow-Origin'] = origin;
        }

        logInfo('Config served (304)', {
          ...logCtx,
          cached: true,
          durationMs: Date.now() - startTime,
        });

        return new Response(null, {
          status: 304,
          headers,
        });
      }

      // --- Build response headers ---
      const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${CONFIG.CACHE_MAX_AGE}`,
        ETag: etag,
        Vary: 'Origin',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
        'Access-Control-Expose-Headers': 'ETag, Cache-Control',
      };

      // Add CORS header for allowed origins (including localhost)
      if (isOriginAllowed) {
        headers['Access-Control-Allow-Origin'] = origin;
      }

      logInfo('Config served', {
        ...logCtx,
        cached: false,
        durationMs: Date.now() - startTime,
      });

      if (method === 'HEAD') {
        return new Response(null, { status: 200, headers });
      }

      return new Response(body, { status: 200, headers });
    } catch (error) {
      const duration = Date.now() - startTime;
      logError('Config error', {
        requestId,
        error: error.message,
        stack: error.stack,
        durationMs: duration,
      });
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};

// Compare the hostname, so https://evil-localhost.example is not treated as local.
// Same check as in cv-download; each Worker is deployed on its own, so it is not shared.
function isLocalOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

// --- Helper: deterministic weak ETag (W/ belongs outside the quotes) ---
async function sha256Etag(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  return `W/"${hex.slice(0, 16)}"`;
}

// --- Structured Logging ---
function logInfo(message, context = {}) {
  console.log(
    JSON.stringify({ level: 'INFO', message, ...context, timestamp: new Date().toISOString() }),
  );
}

function logWarn(message, context = {}) {
  console.warn(
    JSON.stringify({ level: 'WARN', message, ...context, timestamp: new Date().toISOString() }),
  );
}

function logError(message, context = {}) {
  console.error(
    JSON.stringify({ level: 'ERROR', message, ...context, timestamp: new Date().toISOString() }),
  );
}
