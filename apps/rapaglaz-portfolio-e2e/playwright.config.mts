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

export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  // the preset runs a single worker on CI
  workers: isCI ? 2 : undefined,
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
