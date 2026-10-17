import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGIN = 'https://rapaglaz.de';
const FILE = 'cv/Radoslaw_Pawel_Glaz_CV-EN.pdf';

let worker;

function downloadRequest({ file = FILE, method = 'GET', headers = {} } = {}) {
  return new Request(`https://rapaglaz.de/download?file=${encodeURIComponent(file)}`, {
    method,
    headers: { Origin: ORIGIN, 'cf-turnstile-response': 'valid-token', ...headers },
  });
}

function createEnv(overrides = {}) {
  return {
    TURNSTILE_SECRET: 'turnstile-secret',
    PORTFOLIO_FILES: { get: vi.fn(async key => (key === FILE ? { body: 'pdf-bytes' } : null)) },
    ...overrides,
  };
}

// in-memory stand-in for the KV namespace used by the rate limiter
function createKv() {
  const store = new Map();
  return {
    get: vi.fn(async key => (store.has(key) ? JSON.parse(store.get(key)) : null)),
    put: vi.fn(async (key, value) => store.set(key, value)),
  };
}

function mockSiteverify(success) {
  // a fresh Response per call: a body can be read only once
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({ success }));
}

describe('CV download worker', () => {
  beforeEach(async () => {
    // the circuit breaker keeps module-level state, so every test gets a fresh module
    vi.resetModules();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    ({ default: worker } = await import('./index.js'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('answers the preflight for the token header', async () => {
    const response = await worker.fetch(downloadRequest({ method: 'OPTIONS' }), createEnv());

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('cf-turnstile-response');
  });

  it('rejects origins outside the allow-list without calling siteverify', async () => {
    const siteverify = mockSiteverify(true);

    const response = await worker.fetch(
      downloadRequest({ headers: { Origin: 'https://attacker.example' } }),
      createEnv(),
    );

    expect(response.status).toBe(403);
    expect(siteverify).not.toHaveBeenCalled();
  });

  it('rejects file paths outside the cv/ prefix', async () => {
    for (const file of ['private/notes.pdf', 'cv/../private/notes.pdf', 'cv//notes.pdf']) {
      const response = await worker.fetch(downloadRequest({ file }), createEnv());
      expect(response.status).toBe(400);
    }
  });

  it('asks for a token when the header is missing', async () => {
    const response = await worker.fetch(
      downloadRequest({ headers: { 'cf-turnstile-response': '' } }),
      createEnv(),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get('WWW-Authenticate')).toBe('Turnstile realm="cv-download"');
  });

  it('rejects a token that siteverify does not accept', async () => {
    mockSiteverify(false);

    const response = await worker.fetch(downloadRequest(), createEnv());

    expect(response.status).toBe(403);
  });

  it('streams the PDF without caching after a successful verification', async () => {
    const siteverify = mockSiteverify(true);
    const env = createEnv();

    const response = await worker.fetch(downloadRequest(), env);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('pdf-bytes');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="Radoslaw_Pawel_Glaz_CV-EN.pdf"',
    );
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(env.PORTFOLIO_FILES.get).toHaveBeenCalledWith(FILE);
    const [url, init] = siteverify.mock.calls[0];
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    expect(JSON.parse(init.body)).toEqual({ secret: 'turnstile-secret', response: 'valid-token' });
  });

  it('limits each client IP to 10 requests per minute', async () => {
    mockSiteverify(true);
    const env = createEnv({ RATE_LIMIT_STORE: createKv() });
    const headers = { 'CF-Connecting-IP': '203.0.113.7' };

    for (let attempt = 0; attempt < 10; attempt++) {
      const response = await worker.fetch(downloadRequest({ headers }), env);
      expect(response.status).toBe(200);
    }
    const limited = await worker.fetch(downloadRequest({ headers }), env);

    expect(limited.status).toBe(429);
    expect(limited.headers.get('Retry-After')).toBe('60');
  });
});
