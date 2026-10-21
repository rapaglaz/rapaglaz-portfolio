import { describe, expect, it } from 'vitest';
import { describeWranglerConfig, readWranglerConfig } from '../testing/wrangler-config';

const workerDir = new URL('.', import.meta.url);

// Bindings this Worker needs in production. Other env names the code reads must be listed as optional.
describeWranglerConfig('site-fallback', workerDir, {
  required: [],
  optional: [],
});

describe('site-fallback observability', () => {
  it('keeps logs and traces off, because they would record every page view', () => {
    const { observability } = readWranglerConfig(workerDir);

    expect(observability?.logs?.enabled).toBe(false);
    expect(observability?.traces?.enabled).toBe(false);
  });
});
