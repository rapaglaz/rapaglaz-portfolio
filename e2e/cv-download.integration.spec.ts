import { expect, test } from '@playwright/test';
import { visitPortfolio } from './utils';

// Integration tests for CV download flow with real Cloudflare Worker.
test.describe('CV Download - Real Worker Integration', () => {
  test.skip(
    !process.env['INTEGRATION_TEST'],
    'Integration tests disabled. Set INTEGRATION_TEST=true to run.',
  );

  test.beforeEach(async ({ page }) => {
    await visitPortfolio(page);
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
    const langButton = page.locator('button[aria-label="Language Switcher"]');
    await langButton.click();

    const germanOption = page.getByRole('menuitem').filter({ hasText: 'Deutsch' });
    await germanOption.click();

    await page.waitForTimeout(500);

    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });

    const cvButton = page.getByRole('button', { name: 'Lebenslauf' });
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
    let finalDownloadUrl = '';

    page.on('response', async response => {
      if (response.url().includes('r2.cloudflarestorage.com')) {
        finalDownloadUrl = response.url();
      }
    });

    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });

    const cvButton = page.getByRole('button', { name: 'CV' });
    await cvButton.click();

    await downloadPromise;

    await page.waitForTimeout(500);

    // Verify the final URL is from Cloudflare R2
    expect(finalDownloadUrl).toContain('r2.cloudflarestorage.com');
    expect(finalDownloadUrl).toContain('Paul_Glaz_CV');
  });
});
