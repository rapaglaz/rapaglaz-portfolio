import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env['CI'];
const isSSG = process.env['E2E_MODE'] === 'ssg';
const defaultBaseURL = isCI || isSSG ? 'http://localhost:4233' : 'http://localhost:4200';
const baseURL = process.env['PLAYWRIGHT_TEST_BASE_URL'] ?? defaultBaseURL;
const webServerCommand =
  process.env['PLAYWRIGHT_WEB_SERVER_COMMAND'] ??
  (isCI || isSSG
    ? 'node node_modules/serve/build/main.js dist/rapaglaz-portfolio/browser -l 4233'
    : 'pnpm run start');
const webServerUrl = process.env['PLAYWRIGHT_WEB_SERVER_URL'] ?? defaultBaseURL;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // prevent test.only from being committed to CI
  forbidOnly: isCI,
  // retry flaky tests on CI, skip locally for faster feedback
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: 'html',
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
