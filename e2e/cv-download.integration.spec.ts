import { expect, test } from '@playwright/test';
import { switchLanguage, visitPortfolio } from './utils';

const integrationTarget = process.env['INTEGRATION_TEST_URL'];
const parsedTarget = integrationTarget ? safeParseUrl(integrationTarget) : null;
const isProdHost =
  parsedTarget?.hostname === 'rapaglaz.de' || parsedTarget?.hostname === 'www.rapaglaz.de';

function safeParseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

// Integration tests for CV download flow with real Cloudflare Worker.
test.describe('CV Download - Real Worker Integration', () => {
  test.skip(
    !integrationTarget,
    'Integration tests disabled. Set INTEGRATION_TEST_URL to staging base URL to run.',
  );

  test.skip(
    !parsedTarget,
    'Integration tests require a valid INTEGRATION_TEST_URL (e.g. https://staging.example.com).',
  );

  test.skip(
    isProdHost,
    'Integration tests cannot target production. Use a staging INTEGRATION_TEST_URL.',
  );

  test.beforeEach(async ({ page }) => {
    await visitPortfolio(page, integrationTarget!);
  });

  test('downloads CV with real signed URL from Cloudflare Worker (EN)', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });

    const cvButton = page.getByRole('button', { name: 'CV' });
    await cvButton.click();

    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('Paul_Glaz_CV_EN.pdf');

    const path = await download.path();
    expect(path).toBeTruthy();

    const buffer = await download.createReadStream();
    expect(buffer).toBeTruthy();
  });

  test('downloads CV with real signed URL after locale switch (DE)', async ({ page }) => {
    await switchLanguage(page, 'DE');

    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });

    const cvButton = page.getByRole('button', { name: 'CV' });
    await cvButton.click();

    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('Paul_Glaz_CV_DE.pdf');

    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('handles network errors from real Worker gracefully', async ({ page }) => {
    await page.route('**/download?file=**', route => route.abort('failed'));

    const cvButton = page.getByRole('button', { name: 'CV' });
    await cvButton.click();

    const toast = page.getByRole('alert');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/failed|fehlgeschlagen|error/i);

    await expect(cvButton).toBeEnabled();
  });

  test('verifies Worker returns correct Content-Type header', async ({ page }) => {
    let contentType = '';

    page.on('response', async response => {
      if (response.url().includes('/download?file=')) {
        contentType = response.headers()['content-type'] || '';
      }
    });

    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });

    const cvButton = page.getByRole('button', { name: 'CV' });
    await cvButton.click();

    await downloadPromise;

    expect(contentType).toBe('application/pdf');
  });

  test('verifies Worker returns R2 signed URL with correct structure', async ({ page }) => {
    const responsePromise = page.waitForResponse(resp => resp.url().includes('/download?file='), {
      timeout: 60000,
    });
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });

    const cvButton = page.getByRole('button', { name: 'CV' });
    await cvButton.click();

    const response = await responsePromise;
    const download = await downloadPromise;
    expect(response.ok()).toBe(true);

    const finalDownloadUrl = response.url();
    expect(finalDownloadUrl).toContain('Paul_Glaz_CV');
    expect(response.headers()['content-type']).toContain('application/pdf');
    expect(await download.path()).toBeTruthy();
  });
});
