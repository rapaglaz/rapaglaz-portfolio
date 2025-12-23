import type { Page } from '@playwright/test';

// Minimal valid PDF for testing downloads
export const MOCK_PDF_CONTENT = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000101 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
190
%%EOF`;

// mocks feature flag endpoint to keep tests deterministic
export async function mockFeatureFlag(page: Page, openToWork = true): Promise<void> {
  await page.route('https://rapaglaz.de/feature-flag/**', async route => {
    const url = new URL(route.request().url());
    const flagName = url.pathname.split('/').pop() ?? 'openToWork';
    const value = flagName === 'openToWork' ? openToWork : false;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ [flagName]: value }),
    });
  });
}

// waits for hero + navbar to ensure page fully loaded before tests
export async function visitPortfolio(page: Page, url = '/', openToWork = true): Promise<void> {
  await mockFeatureFlag(page, openToWork);
  await page.goto(url);
  await page.getByTestId('section-hero').waitFor({ state: 'visible' });
  await page.getByTestId('navbar').waitFor({ state: 'visible' });
}

// mocks only Turnstile API (frontend) - use when tests need to mock backend errors
export async function mockTurnstileAPI(page: Page): Promise<void> {
  // Mock Turnstile API - instant auto-pass like test key
  await page.addInitScript(() => {
    (window as Window & { turnstile?: unknown }).turnstile = {
      render: (
        _container: HTMLElement,
        options: {
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'before-interactive-callback'?: () => void;
        },
      ): string => {
        setTimeout(() => options.callback?.('test-token'), 50);
        return 'mock-widget-id';
      },
      remove: (): void => {
        // Mock cleanup - no-op
      },
    };
  });

  // Block real Cloudflare script to ensure mock is used
  await page.route('**/challenges.cloudflare.com/**', route => route.abort());
}

// mocks both Turnstile API and backend download - for happy path tests
export async function mockCVDownload(page: Page): Promise<void> {
  await mockTurnstileAPI(page);

  // Mock backend download endpoint - return fake PDF blob
  await page.route('**/download?file=**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/pdf',
      body: MOCK_PDF_CONTENT,
    });
  });
}

// switches language and waits for translation to appear, ensures i18n working
export async function switchLanguage(page: Page, lang: 'EN' | 'DE'): Promise<void> {
  await page.getByRole('option', { name: lang }).click();

  const expectedText = lang === 'DE' ? 'ÜBER MICH' : 'ABOUT ME';
  await page
    .getByTestId('section-about')
    .locator('h2')
    .getByText(expectedText, { exact: false })
    .waitFor({ state: 'visible' });
}
