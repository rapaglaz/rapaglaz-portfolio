import { defineConfig } from 'vitest/config';

// One Vitest process for every project: `pnpm run test:watch` and `test:ui`. Nx runs each project's
// own config for `pnpm test`, the cache and CI.
export default defineConfig({
  test: {
    projects: [
      'apps/*/vitest.config.mts',
      'apps/workers/*/vitest.config.mjs',
      'libs/*/*/vitest.config.mts',
    ],
  },
});
