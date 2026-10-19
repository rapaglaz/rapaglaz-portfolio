import { describeWranglerConfig } from '../testing/wrangler-config.js';

// Bindings this Worker needs in production. Other env names the code reads must be listed as optional.
describeWranglerConfig('cv-download', new URL('.', import.meta.url), {
  required: ['PORTFOLIO_FILES', 'TURNSTILE_SECRET', 'DOWNLOAD_RATE_LIMITER'],
  optional: ['ALLOWED_ORIGINS', 'ALLOW_TEST_TOKEN'],
});
