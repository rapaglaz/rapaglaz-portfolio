import { describe, expect, it, vi } from 'vitest';
import worker, { type Env } from './index';

const ORIGIN = 'https://rapaglaz.de';

type RequestOptions = { method?: string; headers?: Record<string, string> };

function flagRequest(
  path = '/feature-flag/openToWork',
  { method = 'GET', headers = {} }: RequestOptions = {},
): Request {
  return new Request(`${ORIGIN}${path}`, { method, headers: { Origin: ORIGIN, ...headers } });
}

// stand-in for the KV namespace bound as KV; it covers only the text read that the Worker calls,
// not the other overloads of KVNamespace.get
function createEnv(flags: Record<string, string> = {}): Env {
  const get = vi.fn(async (name: string) => flags[name] ?? null);
  return { KV: { get } as unknown as Env['KV'] };
}

describe('feature-flag worker', () => {
  for (const stored of ['true', 'false']) {
    it(`returns the flag as a boolean when KV stores "${stored}"`, async () => {
      const response = await worker.fetch(flagRequest(), createEnv({ openToWork: stored }));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ openToWork: stored === 'true' });
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
      expect(response.headers.get('cache-control')).toBe('no-store');
    });
  }

  it('returns 404 for a flag that KV does not have', async () => {
    const response = await worker.fetch(flagRequest(), createEnv());

    expect(response.status).toBe(404);
  });

  it('rejects a stored value that is not a boolean', async () => {
    const response = await worker.fetch(flagRequest(), createEnv({ openToWork: 'yes' }));

    expect(response.status).toBe(400);
  });

  it('decodes the flag name before reading KV', async () => {
    const env = createEnv({ 'open to work': 'true' });

    const response = await worker.fetch(flagRequest('/feature-flag/open%20to%20work'), env);

    expect(response.status).toBe(200);
    expect(env.KV.get).toHaveBeenCalledWith('open to work');
  });

  for (const [name, path] of [
    ['a malformed escape', '/feature-flag/%E0%A4%A'],
    ['an empty name', '/feature-flag/%20'],
  ]) {
    it(`answers 400 for ${name} without reading KV`, async () => {
      const env = createEnv();

      const response = await worker.fetch(flagRequest(path), env);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Invalid flag name' });
      expect(env.KV.get).not.toHaveBeenCalled();
    });
  }

  it('returns 404 outside /feature-flag/<name>', async () => {
    for (const path of ['/feature-flag', '/feature-flag/a/b', '/other/openToWork']) {
      const response = await worker.fetch(flagRequest(path), createEnv());
      expect(response.status).toBe(404);
    }
  });

  it('rejects methods other than GET and OPTIONS', async () => {
    const response = await worker.fetch(flagRequest(undefined, { method: 'POST' }), createEnv());

    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('GET, OPTIONS');
  });

  it('rejects origins outside the allow-list', async () => {
    const env = createEnv({ openToWork: 'true' });

    for (const method of ['GET', 'OPTIONS']) {
      const response = await worker.fetch(
        flagRequest(undefined, { method, headers: { Origin: 'https://attacker.example' } }),
        env,
      );
      expect(response.status).toBe(403);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    }
    expect(env.KV.get).not.toHaveBeenCalled();
  });

  it('answers the preflight for allowed origins', async () => {
    const response = await worker.fetch(
      flagRequest(undefined, { method: 'OPTIONS', headers: { Origin: 'http://localhost:4200' } }),
      createEnv(),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:4200');
  });

  it('serves requests without an Origin header, without CORS headers', async () => {
    const response = await worker.fetch(
      new Request(`${ORIGIN}/feature-flag/openToWork`),
      createEnv({ openToWork: 'true' }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('hides KV errors behind a generic 500', async () => {
    const env = { KV: { get: vi.fn(async () => Promise.reject(new Error('KV down'))) } };

    const response = await worker.fetch(flagRequest(), env);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal Server Error' });
  });
});
