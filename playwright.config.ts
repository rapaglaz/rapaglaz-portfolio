import { defineConfig, devices } from '@playwright/test';

/** Read environment variables from file. https://github.com/motdotla/dotenv */
// require('dotenv').config();

/** See https://playwright.dev/docs/test-configuration. */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // prevent test.only from being committed to CI
  forbidOnly: !!process.env['CI'],
  // retry flaky tests on CI, skip locally for faster feedback
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 2 : undefined,
  reporter: 'html',
  use: {
    baseURL:
      process.env['PLAYWRIGHT_TEST_BASE_URL'] ??
      (process.env['CI'] ? 'http://localhost:4233' : 'http://localhost:4200'),

    // traces only on retry to save disk space
    trace: 'on-first-retry',

    screenshot: 'only-on-failure',

    video: 'retain-on-failure',
  },

  /* Run your local dev server before starting the tests */
  webServer: {
    command: process.env['CI'] ? 'pnpm run preview' : 'pnpm run start',
    url: process.env['CI'] ? 'http://localhost:4233' : 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120 * 1000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/lighthouse.spec.ts',
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testIgnore: '**/lighthouse.spec.ts',
    },
  ],
});
