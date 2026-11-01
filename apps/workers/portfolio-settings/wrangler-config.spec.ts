import { describeWranglerConfig } from '../testing/wrangler-config';

describeWranglerConfig('portfolio-settings', new URL('.', import.meta.url), {
  required: [],
  optional: [],
});
