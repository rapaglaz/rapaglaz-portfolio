import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  mockCVDownload,
  mockInteractiveTurnstile,
  mockTurnstileAPI,
  switchLanguage,
  visitPortfolio,
} from './utils';

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

test.describe('Interactive CV verification', () => {
  test.beforeEach(async ({ page }) => {
    await mockInteractiveTurnstile(page);
  });

  test('keeps the entire challenge visible at 320 CSS pixels', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await visitPortfolio(page, '/de');
    await page.getByTestId('cv-download-btn').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: 'Schließen' })).toBeFocused();
    const fits = await dialog.evaluate(element => {
      const content = element.querySelector<HTMLElement>('app-turnstile-modal > div');
      const frame = element.querySelector('iframe');
      if (!content || !frame) return false;
      const card = content.getBoundingClientRect();
      const widget = frame.getBoundingClientRect();
      return (
        content.scrollWidth <= content.clientWidth &&
        widget.left >= card.left &&
        widget.right <= card.right
      );
    });
    expect(fits).toBe(true);
    await dialog.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(page.getByTestId('cv-download-btn')).toBeFocused();
  });

  for (const locale of ['en', 'de'] as const) {
    test(`keeps keyboard focus inside the ${locale} dialog and restores it after download`, async ({
      page,
      browserName,
    }) => {
      await visitPortfolio(page, `/${locale}`);
      const cvButton = page.getByTestId('cv-download-btn');
      await cvButton.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog');
      const cancel = dialog.getByRole('button', { name: locale === 'de' ? 'Abbrechen' : 'Cancel' });
      const close = dialog.getByRole('button', {
        name: locale === 'de' ? 'Schließen' : 'Close',
        exact: true,
      });
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await expect(close).toBeFocused();
      await expect(page.locator('app-root')).toHaveAttribute('aria-hidden', 'true');
      await expect(dialog.locator('iframe')).toHaveAttribute('data-mock-language', locale);
      const frame = dialog.frameLocator('iframe');
      const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';

      await page.keyboard.press(tab);
      await expect(frame.getByRole('button', { name: 'Verify', exact: true })).toBeFocused();
      await page.keyboard.press(tab);
      await expect(frame.getByRole('button', { name: 'Fail verification' })).toBeFocused();
      await page.keyboard.press(tab);
      await expect(cancel).toBeFocused();
      await page.keyboard.press(tab);
      await expect(close).toBeFocused();
      await page.keyboard.press(`Shift+${tab}`);
      await expect(cancel).toBeFocused();
      await page.keyboard.press(`Shift+${tab}`);
      await expect(frame.getByRole('button', { name: 'Fail verification' })).toBeFocused();
      await page.keyboard.press(`Shift+${tab}`);
      await expect(frame.getByRole('button', { name: 'Verify', exact: true })).toBeFocused();
      await page.keyboard.press(`Shift+${tab}`);
      await expect(close).toBeFocused();
      expect(
        await close.evaluate(button => Number.parseFloat(getComputedStyle(button).outlineWidth)),
      ).toBeGreaterThanOrEqual(2);

      const results = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
      const downloadPromise = page.waitForEvent('download');
      await page.keyboard.press(tab);
      await expect(frame.getByRole('button', { name: 'Verify', exact: true })).toBeFocused();
      await page.keyboard.press('Enter');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe(
        `Radoslaw_Pawel_Glaz_CV-${locale.toUpperCase()}.pdf`,
      );
      await expect(dialog).toHaveCount(0);
      await expect(cvButton).toBeFocused();
      expect(
        await cvButton.evaluate(button => Number.parseFloat(getComputedStyle(button).outlineWidth)),
      ).toBeGreaterThanOrEqual(2);
      await expect(cvButton).toHaveAttribute('aria-disabled', 'false');
      await expect(page.locator('app-root')).not.toHaveAttribute('aria-hidden');
    });
  }

  for (const method of ['button', 'close', 'Escape', 'backdrop'] as const) {
    test(`cancels through ${method}, sends no download and allows retry`, async ({ page }) => {
      const downloads: string[] = [];
      page.on('request', request => {
        if (request.url().includes('/download?file=')) downloads.push(request.url());
      });
      await visitPortfolio(page, '/de');
      const cvButton = page.getByTestId('cv-download-btn');
      await cvButton.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('button', { name: 'Schließen' })).toBeFocused();
      if (method === 'button') await dialog.getByRole('button', { name: 'Abbrechen' }).click();
      else if (method === 'close') await dialog.getByRole('button', { name: 'Schließen' }).click();
      else if (method === 'Escape') await page.keyboard.press('Escape');
      else await page.locator('.cdk-overlay-backdrop').click({ position: { x: 5, y: 5 } });

      await expect(dialog).toHaveCount(0);
      await expect(cvButton).toBeFocused();
      await expect(cvButton).toHaveAttribute('aria-busy', 'false');
      await expect(page.getByRole('alert')).toHaveCount(0);
      expect(downloads).toEqual([]);

      await cvButton.click();
      await expect(dialog).toBeVisible();
      const downloadPromise = page.waitForEvent('download');
      await dialog
        .frameLocator('iframe')
        .getByRole('button', { name: 'Verify', exact: true })
        .click();
      await downloadPromise;
      expect(downloads).toHaveLength(1);
      await expect(cvButton).toBeFocused();
    });
  }

  test('restores CV focus after an interactive verification error', async ({ page }) => {
    await visitPortfolio(page, '/en');
    const cvButton = page.getByTestId('cv-download-btn');
    await cvButton.click();
    const dialog = page.getByRole('dialog');
    await dialog.frameLocator('iframe').getByRole('button', { name: 'Fail verification' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('alert')).toContainText('Download failed');
    await expect(cvButton).toBeFocused();
    await expect(cvButton).toHaveAttribute('aria-busy', 'false');
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
