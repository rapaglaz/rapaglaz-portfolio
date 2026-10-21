import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from './index';

const ORIGIN = 'https://rapaglaz.de';

type RequestOptions = { url?: string; method?: string; headers?: Record<string, string> };

function configRequest({
  url = `${ORIGIN}/config`,
  method = 'GET',
  headers = {},
}: RequestOptions = {}): Request {
  return new Request(url, { method, headers: { Origin: ORIGIN, ...headers } });
}

describe('portfolio-settings worker', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('serves the public Turnstile site key', async () => {
    const response = await worker.fetch(configRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      turnstileSiteKey: '0x4AAAAAAB98Vx1r87KQ9OmN',
      version: '1.0.0',
    });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=300');
  });

  it('rejects hosts outside production, including workers.dev', async () => {
    for (const url of [
      'https://portfolio-settings.example.workers.dev/config',
      'https://pr-1.preview.example.home.arpa/config',
    ]) {
      const response = await worker.fetch(configRequest({ url }));
      expect(response.status).toBe(403);
    }
  });

  it('answers only on /config itself', async () => {
    for (const path of ['/configXYZ', '/config/extra', '/']) {
      const response = await worker.fetch(configRequest({ url: `${ORIGIN}${path}` }));
      expect(response.status).toBe(404);
    }
  });

  for (const origin of [
    'https://evil-localhost.example',
    'https://localhost.attacker.example',
    'http://127.0.0.1.attacker.example',
    'https://attacker.example',
  ]) {
    it(`sends no CORS header to ${origin}`, async () => {
      const response = await worker.fetch(configRequest({ headers: { Origin: origin } }));

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
  }

  it('allows local development origins in the preflight', async () => {
    const response = await worker.fetch(
      configRequest({ method: 'OPTIONS', headers: { Origin: 'http://localhost:4200' } }),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:4200');
  });

  it('rejects methods other than GET, HEAD and OPTIONS', async () => {
    const response = await worker.fetch(configRequest({ method: 'POST' }));

    expect(response.status).toBe(405);
  });

  it('answers HEAD without a body', async () => {
    const response = await worker.fetch(configRequest({ method: 'HEAD' }));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
  });

  it('sends a weak ETag and answers 304 when it matches', async () => {
    const first = await worker.fetch(configRequest());
    const etag = first.headers.get('ETag');
    expect(etag).toMatch(/^W\/"[0-9a-f]{16}"$/);

    const revalidated = await worker.fetch(
      configRequest({ headers: { 'If-None-Match': `W/"0000000000000000", ${etag}` } }),
    );

    expect(revalidated.status).toBe(304);
    expect(revalidated.headers.get('ETag')).toBe(etag);
  });

  it('serves the body again when the ETag does not match', async () => {
    const response = await worker.fetch(
      configRequest({ headers: { 'If-None-Match': 'W/"0000000000000000"' } }),
    );

    expect(response.status).toBe(200);
  });
});
