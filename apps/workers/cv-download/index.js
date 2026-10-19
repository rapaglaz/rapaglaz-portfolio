/**
 * Worker for secure CV download via Turnstile verification
 */

// --- Configuration ---
const CONFIG = {
  ALLOWED_FILE_PREFIX: 'cv/',
  TURNSTILE_API_TIMEOUT_MS: 5000,
  TURNSTILE_MAX_FAILURES: 3,
  TURNSTILE_FAILURE_WINDOW_MS: 300000,
  TEST_TOKEN: 'XXXX.DUMMY.TOKEN.XXXX',
  CORS_MAX_AGE: '86400',
  DEFAULT_ALLOWED_ORIGINS: [
    'https://rapaglaz.de',
    'https://www.rapaglaz.de',
    'https://rapaglaz.github.io',
  ],
};

const HEADERS = {
  CONTENT_TYPE_PDF: 'application/pdf',
  WWW_AUTHENTICATE: 'Turnstile realm="cv-download"',
};

let turnstileFailures = 0;
let turnstileLastFailureTime = 0;

export default {
  async fetch(request, env) {
    const sourceOrigin =
      request.headers.get('Origin') || extractOriginFromReferer(request.headers.get('Referer'));
    // replaced from the environment below; the catch block keeps the defaults if that fails
    let allowedOrigins = CONFIG.DEFAULT_ALLOWED_ORIGINS;

    try {
      const url = new URL(request.url);
      const remoteIp = request.headers.get('CF-Connecting-IP');
      const clientIp = remoteIp || 'unknown';

      // Get allowed origins from environment or use defaults
      allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS);

      // Helper function to build responses with CORS support
      const buildResponse = (body, status, extraHeaders = {}) => {
        const headers = new Headers(extraHeaders);

        // Always add CORS headers if origin is allowed (even for errors)
        if (isOriginAllowed(sourceOrigin, allowedOrigins)) {
          headers.set('Access-Control-Allow-Origin', sourceOrigin.replace(/\/$/, ''));
          headers.set('Vary', 'Origin');

          // Preflight-specific headers
          if (request.method === 'OPTIONS') {
            headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
            headers.set('Access-Control-Allow-Headers', 'cf-turnstile-response');
            headers.set('Access-Control-Max-Age', CONFIG.CORS_MAX_AGE);
          }
        }

        return new Response(body, { status, headers });
      };

      // --- Handle OPTIONS (Preflight) ---
      if (request.method === 'OPTIONS') {
        return buildResponse(null, 204);
      }

      // --- Validate endpoint ---
      if (url.pathname !== '/download') {
        return buildResponse('Not Found', 404);
      }

      // --- Validate method ---
      if (request.method !== 'GET') {
        return buildResponse('Method Not Allowed', 405, { Allow: 'GET, OPTIONS' });
      }

      // --- Validate origin ---
      if (!isOriginAllowed(sourceOrigin, allowedOrigins)) {
        console.warn('Blocked Origin:', sourceOrigin);
        return buildResponse('Forbidden: Origin not allowed', 403);
      }

      // --- Rate limiting ---
      if (env.DOWNLOAD_RATE_LIMITER) {
        const { success } = await env.DOWNLOAD_RATE_LIMITER.limit({ key: clientIp });
        if (!success) return buildResponse('Too Many Requests', 429, { 'Retry-After': '60' });
      }

      // --- Get parameters ---
      const filePath = url.searchParams.get('file');
      const token = request.headers.get('cf-turnstile-response');

      if (!filePath || !isValidFilePath(filePath)) {
        return buildResponse('Bad Request: Invalid file path', 400);
      }

      if (!token) {
        return buildResponse('Unauthorized: Missing token', 401, {
          'WWW-Authenticate': HEADERS.WWW_AUTHENTICATE,
        });
      }

      // --- Verify Turnstile ---
      const turnstileValid = await verifyTurnstileWithCircuitBreaker(token, env, remoteIp);
      if (!turnstileValid) {
        return buildResponse('Forbidden: Turnstile verification failed', 403);
      }

      // --- Fetch from R2 ---
      const object = await env.PORTFOLIO_FILES.get(filePath);
      if (!object) {
        return buildResponse('Not Found: File does not exist', 404);
      }

      // --- Success: Stream file ---
      const filename = filePath.split('/').pop();
      const successHeaders = {
        'Content-Type': HEADERS.CONTENT_TYPE_PDF,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex, noarchive, nofollow',
        'Cache-Control': 'private, no-store',
      };

      return buildResponse(object.body, 200, successHeaders);
    } catch (error) {
      console.error('Internal error:', error.message);
      // CORS headers only for allowed origins, as on every other response
      const headers = new Headers({ 'Content-Type': 'text/plain; charset=utf-8' });
      if (isOriginAllowed(sourceOrigin, allowedOrigins)) {
        headers.set('Access-Control-Allow-Origin', sourceOrigin.replace(/\/$/, ''));
        headers.set('Vary', 'Origin');
      }
      return new Response('Internal Server Error', { status: 500, headers });
    }
  },
};

// --- Helper Functions ---

function parseAllowedOrigins(originsString) {
  if (!originsString) return CONFIG.DEFAULT_ALLOWED_ORIGINS;
  return originsString
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function extractOriginFromReferer(referer) {
  if (!referer) return '';
  try {
    const url = new URL(referer);
    return `${url.protocol}//${url.host}`;
  } catch {
    return '';
  }
}

function isValidFilePath(filePath) {
  return (
    filePath.startsWith(CONFIG.ALLOWED_FILE_PREFIX) &&
    !filePath.includes('..') &&
    !filePath.includes('//') &&
    !/[\x00-\x1f\x7f]/.test(filePath) // No control characters
  );
}

function isOriginAllowed(sourceOrigin, allowedOrigins) {
  if (!sourceOrigin) return false;
  const cleanOrigin = sourceOrigin.trim().replace(/\/$/, '');

  // Localhost always allowed for development
  if (isLocalOrigin(cleanOrigin)) {
    return true;
  }

  return allowedOrigins.some(allowed => allowed === cleanOrigin);
}

// Compare the hostname, so https://localhost.attacker.example is not treated as local
function isLocalOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

async function verifyTurnstileWithCircuitBreaker(token, env, remoteIp) {
  const now = Date.now();

  // Check circuit breaker state
  if (
    turnstileFailures >= CONFIG.TURNSTILE_MAX_FAILURES &&
    now - turnstileLastFailureTime < CONFIG.TURNSTILE_FAILURE_WINDOW_MS
  ) {
    return isTestToken(token, env);
  }

  const { valid, outage } = await verifyTurnstile(token, env, remoteIp);

  // Only siteverify outages open the breaker; a rejected token is a normal answer
  if (outage) {
    turnstileFailures++;
    turnstileLastFailureTime = now;
  } else {
    turnstileFailures = 0;
  }

  return valid;
}

// Origin and Referer are set by the client, so only Worker configuration may skip siteverify.
// ALLOW_TEST_TOKEN belongs on a development Worker, never on production.
function isTestToken(token, env) {
  return env.ALLOW_TEST_TOKEN === 'true' && token === CONFIG.TEST_TOKEN;
}

async function verifyTurnstile(token, env, remoteIp) {
  if (isTestToken(token, env)) return { valid: true, outage: false };

  // AbortController + setTimeout, as in Cloudflare's own Turnstile example
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.TURNSTILE_API_TIMEOUT_MS);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // remoteip is optional; Cloudflare's examples pass CF-Connecting-IP
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET,
        response: token,
        ...(remoteIp && { remoteip: remoteIp }),
      }),
      signal: controller.signal,
    });
    const result = await res.json();
    // any parsed answer means siteverify is up; only internal-error counts as an outage
    const outage = result['error-codes']?.includes('internal-error') === true;
    return { valid: result.success === true, outage };
  } catch {
    // network error, timeout or a body that is not JSON
    return { valid: false, outage: true };
  } finally {
    clearTimeout(timeoutId);
  }
}
