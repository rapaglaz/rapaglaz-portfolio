import { expect, test } from '@playwright/test';
import { mockCVDownload, mockTurnstileAPI, switchLanguage, visitPortfolio } from './utils';

test.describe('CV Download', () => {
  test.beforeEach(async ({ page }) => {
    await mockCVDownload(page);
    await visitPortfolio(page);
  });

  test('downloads CV in the active language', async ({ page }) => {
    const cvButton = page.getByRole('button', { name: 'CV' });

    const enDownloadPromise = page.waitForEvent('download');
    await cvButton.click();
    const enDownload = await enDownloadPromise;
    expect(enDownload.suggestedFilename()).toBe('Radoslaw_Pawel_Glaz_CV-EN.pdf');

    await switchLanguage(page, 'DE');

    const deDownloadPromise = page.waitForEvent('download');
    await cvButton.click();
    const deDownload = await deDownloadPromise;
    expect(deDownload.suggestedFilename()).toBe('Radoslaw_Pawel_Glaz_CV-DE.pdf');
  });
});

test.describe('CV Download - Turnstile Verification Failures', () => {
  test('handles Turnstile verification error', async ({ page }) => {
    // mock must be installed before navigation, otherwise the widget mock
    // never loads and the test exercises the script-load failure path instead
    await mockTurnstileAPI(page, 'error');
    await visitPortfolio(page);

    const cvButton = page.getByRole('button', { name: 'CV' });
    await cvButton.click();

    const toast = page.getByRole('alert');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/failed|fehlgeschlagen|error/i);
    await expect(cvButton).toBeEnabled();
  });

  test('handles Turnstile script load failure', async ({ page }) => {
    await visitPortfolio(page);
    await page.route('**/challenges.cloudflare.com/**', route => route.abort('failed'));

    const cvButton = page.getByRole('button', { name: 'CV' });
    await cvButton.click();

    const toast = page.getByRole('alert');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/failed|fehlgeschlagen|error/i);
    await expect(cvButton).toBeEnabled();
  });
});
