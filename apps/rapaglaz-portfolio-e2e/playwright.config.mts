import { join } from 'node:path';
import { workspaceRoot } from '@nx/devkit';
import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env['CI'];
const isSSG = process.env['E2E_MODE'] === 'ssg';
const defaultBaseURL = isCI || isSSG ? 'http://localhost:4233' : 'http://localhost:4200';
const baseURL = process.env['PLAYWRIGHT_TEST_BASE_URL'] ?? defaultBaseURL;
const webServerCommand =
  process.env['PLAYWRIGHT_WEB_SERVER_COMMAND'] ??
  (isCI || isSSG
    ? 'node node_modules/serve/build/main.js dist/apps/rapaglaz-portfolio/browser -l 4233'
    : 'pnpm exec nx run rapaglaz-portfolio:serve');
const webServerUrl = process.env['PLAYWRIGHT_WEB_SERVER_URL'] ?? defaultBaseURL;
const preset = nxE2EPreset(import.meta.dirname, { testDir: './src' });

export default defineConfig({
  ...preset,
  // the preset runs a single worker on CI
  workers: isCI ? 2 : undefined,
  // on CI the e2e action reads the flaky tests from the JSON report; test-output is an output of
  // the e2e target, so a cache hit restores the report too
  reporter: isCI
    ? [...preset.reporter, ['json', { outputFile: join(preset.outputDir, 'results.json') }]]
    : preset.reporter,
  use: {
    baseURL,

    // traces only on retry to save disk space
    trace: 'on-first-retry',

    screenshot: 'only-on-failure',

    video: 'retain-on-failure',
  },

  // CI and e2e:ssg serve the static build; local runs reuse a running dev server
  webServer: {
    command: webServerCommand,
    url: webServerUrl,
    reuseExistingServer: !isCI && !isSSG,
    timeout: 120 * 1000,
    cwd: workspaceRoot,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
