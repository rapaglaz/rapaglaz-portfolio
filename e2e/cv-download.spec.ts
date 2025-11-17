import { expect, test } from '@playwright/test';
import { mockTurnstile, switchLanguage, visitPortfolio } from './utils';

test.describe('CV Download', () => {
  test.beforeEach(async ({ page }) => {
    await mockTurnstile(page);
    await visitPortfolio(page);
  });

  test('downloads CV with Turnstile verification', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    const cvButton = page.getByRole('button', { name: 'CV' });

    await cvButton.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('Paul_Glaz_CV_EN.pdf');
  });

  test('downloads language-specific CV after locale switch', async ({ page }) => {
    await switchLanguage(page, 'DE');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'CV' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('Paul_Glaz_CV_DE.pdf');
  });
});

test.describe('CV Download - Turnstile Verification Failures', () => {
  test.beforeEach(async ({ page }) => {
    await visitPortfolio(page);
  });

  test('handles Turnstile verification error', async ({ page }) => {
    await page.addInitScript(() => {
      (window as Window & { turnstile?: unknown }).turnstile = {
        render: (_container: HTMLElement, options: { 'error-callback'?: () => void }): string => {
          setTimeout(() => options['error-callback']?.(), 100);
          return 'mock-widget-id';
        },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        remove: (): void => {},
      };
    });

    await page.route('**/challenges.cloudflare.com/**', route => route.abort());

    const cvButton = page.getByRole('button', { name: 'CV' });
    await cvButton.click();

    const toast = page.getByRole('alert');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/failed|fehlgeschlagen|error/i);
    await expect(cvButton).toBeEnabled();
  });

  test('handles Turnstile script load failure', async ({ page }) => {
    await page.route('**/challenges.cloudflare.com/**', route => route.abort('failed'));

    const cvButton = page.getByRole('button', { name: 'CV' });
    await cvButton.click();

    const toast = page.getByRole('alert');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/failed|fehlgeschlagen|error/i);
    await expect(cvButton).toBeEnabled();
  });
});
