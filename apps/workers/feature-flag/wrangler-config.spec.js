import { describeWranglerConfig } from '../testing/wrangler-config';

// Bindings this Worker needs in production. Other env names the code reads must be listed as optional.
describeWranglerConfig('feature-flag', new URL('.', import.meta.url), {
  required: ['KV'],
  optional: [],
});
