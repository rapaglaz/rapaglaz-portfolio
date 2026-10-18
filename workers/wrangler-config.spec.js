import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Bindings each Worker needs in production. Other env names the code reads must be listed as optional.
const WORKERS = {
  'cv-download': {
    required: ['PORTFOLIO_FILES', 'TURNSTILE_SECRET', 'DOWNLOAD_RATE_LIMITER'],
    optional: ['ALLOWED_ORIGINS', 'ALLOW_TEST_TOKEN'],
  },
  'feature-flag': { required: ['KV'], optional: [] },
  'portfolio-settings': { required: [], optional: [] },
};

// The configs only use whole-line comments and trailing commas, which is all this strips.
function readConfig(worker) {
  const text = readFileSync(new URL(`./${worker}/wrangler.jsonc`, import.meta.url), 'utf8');
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

function envNamesReadByCode(worker) {
  const code = readFileSync(new URL(`./${worker}/index.js`, import.meta.url), 'utf8');
  return new Set([...code.matchAll(/\benv\.([A-Z][A-Z0-9_]*)/g)].map(([, name]) => name));
}

describe.each(Object.entries(WORKERS))('%s wrangler.jsonc', (worker, { required, optional }) => {
  const config = readConfig(worker);

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
    for (const name of envNamesReadByCode(worker)) expect(known).toContain(name);
  });

  it('never lets production skip siteverify for the test token', () => {
    expect(config.vars ?? {}).not.toHaveProperty('ALLOW_TEST_TOKEN');
  });
});
