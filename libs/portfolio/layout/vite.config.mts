/// <reference types='vitest' />
import { resolve } from 'node:path';
import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/portfolio/layout',
  // Libraries have no tsconfig.app.json, which AnalogJS looks for by default
  plugins: [angular({ tsconfig: resolve(import.meta.dirname, 'tsconfig.spec.json') })],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'portfolio-layout',
    watch: false,
    globals: true,
    environment: 'jsdom',
    // AnalogJS defaults to vmThreads, where jsdom's window is the global and window.location
    // cannot be redefined; the window mocks in @rapaglaz/shared/testing need forks
    pool: 'forks',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/portfolio/layout',
      provider: 'v8' as const,
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/test-setup.ts'],
      // Sonar resolves lcov paths from the repository root
      reporter: [
        'text-summary',
        ['lcov', { projectRoot: resolve(import.meta.dirname, '../../..') }],
        'html',
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
}));
