import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The configs only use whole-line comments and trailing commas, which is all this strips.
function readConfig(workerDir) {
  const text = readFileSync(new URL('wrangler.jsonc', workerDir), 'utf8');
  return JSON.parse(text.replace(/^\s*\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1'));
}

function declaredNames(config) {
  return new Set([
    ...(config.kv_namespaces ?? []).map(({ binding }) => binding),
    ...(config.r2_buckets ?? []).map(({ binding }) => binding),
    ...(config.ratelimits ?? []).map(({ name }) => name),
    ...Object.keys(config.vars ?? {}),
    ...(config.secrets?.required ?? []),
  ]);
}

function envNamesReadByCode(workerDir) {
  const code = readFileSync(new URL('index.js', workerDir), 'utf8');
  return new Set([...code.matchAll(/\benv\.([A-Z][A-Z0-9_]*)/g)].map(([, name]) => name));
}

// workerDir is the Worker folder URL, e.g. new URL('.', import.meta.url) from its spec.
// required: bindings the Worker needs in production; optional: other env names the code may read.
export function describeWranglerConfig(worker, workerDir, { required, optional }) {
  describe(`${worker} wrangler.jsonc`, () => {
    const config = readConfig(workerDir);

    it('targets the Cloudflare Worker of the same name and leaves routes to the dashboard', () => {
      expect(config.name).toBe(worker);
      expect(config.main).toBe('index.js');
      expect(config.workers_dev).toBe(false);
      expect(config).not.toHaveProperty('route');
      expect(config).not.toHaveProperty('routes');
    });

    it('declares every binding the Worker needs in production', () => {
      const declared = declaredNames(config);
      for (const name of required) expect(declared).toContain(name);
    });

    it('accounts for every env name the code reads', () => {
      const known = new Set([...required, ...optional]);
      for (const name of envNamesReadByCode(workerDir)) expect(known).toContain(name);
    });

    it('never lets production skip siteverify for the test token', () => {
      expect(config.vars ?? {}).not.toHaveProperty('ALLOW_TEST_TOKEN');
    });
  });
}
