import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from './index';

const SITE = 'https://rapaglaz.de';

type RequestOptions = { path?: string; method?: string };

function pageRequest({ path = '/en', method = 'GET' }: RequestOptions = {}): Request {
  return new Request(`${SITE}${path}`, { method });
}

describe('site-fallback worker', () => {
  const origin = vi.fn<typeof fetch>();

  beforeEach(() => {
    origin.mockReset();
    vi.stubGlobal('fetch', origin);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('passes the answer of a healthy origin through unchanged', async () => {
    const healthy = new Response('<html>portfolio</html>', { status: 200 });
    origin.mockResolvedValue(healthy);

    const response = await worker.fetch(pageRequest());

    expect(response).toBe(healthy);
  });

  it('keeps client errors, so that a missing page stays a 404', async () => {
    const notFound = new Response('Not Found', { status: 404 });
    origin.mockResolvedValue(notFound);

    expect(await worker.fetch(pageRequest({ path: '/en/missing' }))).toBe(notFound);
  });

  for (const status of [500, 502, 503, 504, 520, 521, 522, 523, 524, 525, 526, 527]) {
    it(`replaces the origin error ${status} with the offline page`, async () => {
      origin.mockResolvedValue(new Response('origin error', { status }));

      const response = await worker.fetch(pageRequest());

      expect(response.status).toBe(503);
      expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
      expect(await response.text()).toContain('Back in a moment');
    });
  }

  it('shows the offline page when the request to the origin fails', async () => {
    origin.mockRejectedValue(new TypeError('network error'));

    const response = await worker.fetch(pageRequest());

    expect(response.status).toBe(503);
  });

  it('tells clients and crawlers that the outage is temporary and must not be cached', async () => {
    origin.mockResolvedValue(new Response('', { status: 521 }));

    const { headers } = await worker.fetch(pageRequest());

    expect(headers.get('Retry-After')).toBe('300');
    expect(headers.get('Cache-Control')).toBe('no-store');
    expect(headers.get('X-Robots-Tag')).toBe('noindex');
    expect(headers.get('Content-Security-Policy')).toContain("default-src 'none'");
  });

  it('writes the page in German below /de and in English elsewhere', async () => {
    origin.mockImplementation(() => Promise.resolve(new Response('', { status: 521 })));

    const german = await (await worker.fetch(pageRequest({ path: '/de' }))).text();
    const germanSubpage = await (await worker.fetch(pageRequest({ path: '/de/' }))).text();
    const english = await (await worker.fetch(pageRequest({ path: '/en' }))).text();
    const lookalike = await (await worker.fetch(pageRequest({ path: '/design' }))).text();

    expect(german).toContain('<html lang="de">');
    expect(german).toContain('Gleich wieder da');
    expect(germanSubpage).toContain('<html lang="de">');
    expect(english).toContain('<html lang="en">');
    expect(lookalike).toContain('<html lang="en">');
  });

  it('leaves no placeholder in the page and refreshes it every minute', async () => {
    origin.mockImplementation(() => Promise.resolve(new Response('', { status: 521 })));

    for (const path of ['/en', '/de']) {
      const html = await (await worker.fetch(pageRequest({ path }))).text();

      expect(html).not.toMatch(/\[\[\w+\]\]/);
      expect(html).toMatch(/http-equiv="refresh"\s+content="60"/);
    }
  });

  it('answers HEAD with the status and without a body', async () => {
    origin.mockResolvedValue(new Response('', { status: 521 }));

    const response = await worker.fetch(pageRequest({ method: 'HEAD' }));

    expect(response.status).toBe(503);
    expect(await response.text()).toBe('');
  });

  it('does not touch other methods, even when the origin fails', async () => {
    const failed = new Response('origin error', { status: 521 });
    origin.mockResolvedValue(failed);

    const response = await worker.fetch(pageRequest({ method: 'POST' }));

    expect(response).toBe(failed);
  });
});
