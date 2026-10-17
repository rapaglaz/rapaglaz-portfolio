/**
 * Config Worker - Turnstile site key endpoint
 *
 * Features:
 * - Host pinning (production + preview environments)
 * - ETag-based caching with conditional requests
 * - CORS support for allowed origins (including localhost)
 * - Request tracking with unique IDs
 * - Structured logging
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
      const isCloudflarePreview = hostname.endsWith('.workers.dev');
      const isLocalPreview =
        hostname.endsWith('.home.arpa') || hostname.includes('.preview.istari.home.arpa');
      const isPreview = isCloudflarePreview || isLocalPreview;

      const allowedProdHosts = new Set(CONFIG.ALLOWED_PROD_HOSTS);

      if (!isPreview && !allowedProdHosts.has(hostname)) {
        logWarn('Forbidden host', logCtx);
        return new Response('Forbidden host', { status: 403 });
      }

      // --- Path validation ---
      if (!url.pathname.startsWith('/config')) {
        logInfo('Endpoint not found', logCtx);
        return new Response('Not Found', { status: 404 });
      }

      // --- CORS: allow localhost + whitelisted origins ---
      const isOriginAllowed =
        origin &&
        (origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          ALLOWED_ORIGINS.includes(origin));

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
        env: isPreview ? 'preview' : 'production',
        version: CONFIG.VERSION,
      };
      const body = JSON.stringify(payload);

      // --- Deterministic ETag ---
      const etag = await sha256Etag(body);
      const inm = request.headers.get('If-None-Match');

      // Handle 304 Not Modified
      if (inm && inm === etag) {
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
        env: payload.env,
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

// --- Helper: deterministic ETag ---
async function sha256Etag(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  return `"W/${hex.slice(0, 16)}"`;
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
