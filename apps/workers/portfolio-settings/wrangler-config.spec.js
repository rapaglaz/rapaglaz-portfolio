import { describeWranglerConfig } from '../testing/wrangler-config.js';

// Bindings this Worker needs in production. Other env names the code reads must be listed as optional.
describeWranglerConfig('portfolio-settings', new URL('.', import.meta.url), {
  required: [],
  optional: [],
});
