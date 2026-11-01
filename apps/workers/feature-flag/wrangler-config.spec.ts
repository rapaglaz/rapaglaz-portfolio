import { describeWranglerConfig } from '../testing/wrangler-config';

describeWranglerConfig('feature-flag', new URL('.', import.meta.url), {
  required: ['KV'],
  optional: [],
});
