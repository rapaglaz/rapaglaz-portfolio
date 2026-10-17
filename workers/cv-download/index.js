/**
 * Worker for secure CV download via Turnstile verification
 */

// --- Configuration ---
const CONFIG = {
  ALLOWED_FILE_PREFIX: 'cv/',
  MAX_REQUESTS_PER_MINUTE: 10,
  RATE_LIMIT_WINDOW_MS: 60000,
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
  CONTENT_TYPE_JSON: 'application/json',
  CONTENT_TYPE_PDF: 'application/pdf',
  WWW_AUTHENTICATE: 'Turnstile realm="cv-download"',
};

let turnstileFailures = 0;
let turnstileLastFailureTime = 0;

export default {
  async fetch(request, env) {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      const url = new URL(request.url);
      const origin = request.headers.get('Origin') || '';
      const referer = request.headers.get('Referer') || '';
      const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

      // Get allowed origins from environment or use defaults
      const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS);

      // Helper function to build responses with CORS support
      const buildResponse = (body, status, extraHeaders = {}) => {
        const headers = new Headers(extraHeaders);
        const sourceOrigin = origin || extractOriginFromReferer(referer);

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
      if (!isOriginAllowed(origin || extractOriginFromReferer(referer), allowedOrigins)) {
        console.warn('Blocked Origin:', origin || referer);
        return buildResponse('Forbidden: Origin not allowed', 403);
      }

      // --- Rate limiting ---
      if (env.RATE_LIMIT_STORE) {
        const rateLimitResult = await checkRateLimit(
          env.RATE_LIMIT_STORE,
          clientIp,
          CONFIG.MAX_REQUESTS_PER_MINUTE,
        );
        if (!rateLimitResult.allowed) {
          return buildResponse('Too Many Requests', 429, { 'Retry-After': '60' });
        }
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
      const turnstileValid = await verifyTurnstileWithCircuitBreaker(token, env);
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
      // Return error with CORS headers
      const headers = new Headers({ 'Content-Type': 'text/plain; charset=utf-8' });
      const sourceOrigin = request.headers.get('Origin') || '';
      if (sourceOrigin) {
        headers.set('Access-Control-Allow-Origin', sourceOrigin);
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
  if (cleanOrigin.includes('localhost') || cleanOrigin.includes('127.0.0.1')) {
    return true;
  }

  return allowedOrigins.some(allowed => allowed === cleanOrigin);
}

async function checkRateLimit(kvStore, clientIp, maxRequests) {
  const key = `ratelimit:${clientIp}`;
  const now = Date.now();
  try {
    const data = (await kvStore.get(key, 'json')) || { count: 0, windowStart: now };
    if (now - data.windowStart > CONFIG.RATE_LIMIT_WINDOW_MS) {
      data.count = 0;
      data.windowStart = now;
    }
    if (data.count >= maxRequests) return { allowed: false };
    data.count++;
    await kvStore.put(key, JSON.stringify(data), { expirationTtl: 60 });
    return { allowed: true };
  } catch {
    // Fail open - allow request if rate limiting fails
    return { allowed: true };
  }
}

async function verifyTurnstileWithCircuitBreaker(token, env) {
  const now = Date.now();

  // Check circuit breaker state
  if (
    turnstileFailures >= CONFIG.TURNSTILE_MAX_FAILURES &&
    now - turnstileLastFailureTime < CONFIG.TURNSTILE_FAILURE_WINDOW_MS
  ) {
    return isTestToken(token, env);
  }

  const result = await verifyTurnstile(token, env);

  // Update circuit breaker state
  if (!result && !isTestToken(token, env)) {
    turnstileFailures++;
    turnstileLastFailureTime = now;
  } else if (result) {
    turnstileFailures = 0;
  }

  return result;
}

// Origin and Referer are set by the client, so only Worker configuration may skip siteverify.
// ALLOW_TEST_TOKEN belongs on a development Worker, never on production.
function isTestToken(token, env) {
  return env.ALLOW_TEST_TOKEN === 'true' && token === CONFIG.TEST_TOKEN;
}

async function verifyTurnstile(token, env) {
  if (isTestToken(token, env)) return true;

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token }),
    });
    const result = await res.json();
    return result.success === true;
  } catch {
    return false;
  }
}
