import { relative, resolve } from 'node:path';
import angular from '@analogjs/vite-plugin-angular';
import { defineConfig, type ViteUserConfig } from 'vitest/config';

// Vite injects import.meta.dirname for every bundled config module, so this is the repository root
const workspaceRoot = import.meta.dirname;

// Shared Vitest config of the Angular app and libraries; each project's vitest.config.mts calls it
// with its own directory. The Vitest name matches the Nx project name: libs/shared/ui → shared-ui.
export function angularVitestConfig(projectDir: string): ViteUserConfig {
  const projectRoot = relative(workspaceRoot, projectDir);

  return defineConfig({
    root: projectDir,
    cacheDir: resolve(workspaceRoot, 'node_modules/.vite', projectRoot),
    // Nx also loads this config outside Vitest, where AnalogJS would look for a tsconfig.app.json
    plugins: [angular({ tsconfig: resolve(projectDir, 'tsconfig.spec.json') })],
    resolve: {
      tsconfigPaths: true,
    },
    test: {
      name: projectRoot.split('/').slice(1).join('-'),
      watch: false,
      globals: true,
      environment: 'jsdom',
      // AnalogJS defaults to vmThreads, where jsdom's window is the global and window.location
      // cannot be redefined; the window mocks in @rapaglaz/shared/testing need forks
      pool: 'forks',
      include: ['src/**/*.spec.ts'],
      setupFiles: ['src/test-setup.ts'],
      reporters: ['default'],
      coverage: {
        reportsDirectory: resolve(workspaceRoot, 'coverage', projectRoot),
        provider: 'v8',
        include: ['src/**/*.ts'],
        exclude: ['src/**/*.spec.ts', 'src/test-setup.ts'],
        // Sonar resolves lcov paths from the repository root
        reporter: ['text-summary', ['lcov', { projectRoot: workspaceRoot }], 'html'],
        thresholds: {
          statements: 80,
          branches: 70,
          functions: 80,
          lines: 80,
        },
      },
    },
  });
}
