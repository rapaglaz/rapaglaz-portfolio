import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

type WranglerConfig = {
  name?: string;
  main?: string;
  workers_dev?: boolean;
  kv_namespaces?: { binding: string }[];
  r2_buckets?: { binding: string }[];
  ratelimits?: { name: string }[];
  vars?: Record<string, string>;
  secrets?: { required?: string[] };
};

type ExpectedEnv = {
  required: string[];
  optional: string[];
};

// URL is the Workers runtime type here, so Node's fs gets a path, not the URL object
function readWorkerFile(workerDir: URL, file: string): string {
  return readFileSync(fileURLToPath(new URL(file, workerDir).href), 'utf8');
}

// The configs only use whole-line comments and trailing commas, which is all this strips.
function readConfig(workerDir: URL): WranglerConfig {
  const text = readWorkerFile(workerDir, 'wrangler.jsonc');
  return JSON.parse(
    text.replace(/^\s*\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1'),
  ) as WranglerConfig;
}

function declaredNames(config: WranglerConfig): Set<string> {
  return new Set([
    ...(config.kv_namespaces ?? []).map(({ binding }) => binding),
    ...(config.r2_buckets ?? []).map(({ binding }) => binding),
    ...(config.ratelimits ?? []).map(({ name }) => name),
    ...Object.keys(config.vars ?? {}),
    ...(config.secrets?.required ?? []),
  ]);
}

// entry is the main file from wrangler.jsonc, index.js while a Worker is still JavaScript
function envNamesReadByCode(workerDir: URL, entry: string): Set<string> {
  const code = readWorkerFile(workerDir, entry);
  return new Set([...code.matchAll(/\benv\.([A-Z][A-Z0-9_]*)/g)].map(([, name]) => name));
}

// workerDir is the Worker folder URL, e.g. new URL('.', import.meta.url) from its spec.
// required: bindings the Worker needs in production; optional: other env names the code may read.
export function describeWranglerConfig(
  worker: string,
  workerDir: URL,
  { required, optional }: ExpectedEnv,
): void {
  describe(`${worker} wrangler.jsonc`, () => {
    const config = readConfig(workerDir);

    it('targets the Cloudflare Worker of the same name and leaves routes to the dashboard', () => {
      expect(config.name).toBe(worker);
      // index.js stays allowed while some Workers are still JavaScript
      expect(['index.js', 'index.ts']).toContain(config.main);
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
      for (const name of envNamesReadByCode(workerDir, config.main ?? 'index.ts')) {
        expect(known).toContain(name);
      }
    });

    it('never lets production skip siteverify for the test token', () => {
      expect(config.vars ?? {}).not.toHaveProperty('ALLOW_TEST_TOKEN');
    });
  });
}
