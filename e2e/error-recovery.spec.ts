import { expect, test } from '@playwright/test';
import {
  MOCK_PDF_CONTENT,
  mockTurnstile,
  mockTurnstileAPI,
  switchLanguage,
  visitPortfolio,
} from './utils';

test.describe('Error Recovery - Backend Errors', () => {
  test.beforeEach(async ({ page }) => {
    await mockTurnstileAPI(page);
    await visitPortfolio(page);
  });

  test('user recovers from network error and successfully downloads CV', async ({ page }) => {
    let attemptCount = 0;

    await page.route('**/download?file=**', async route => {
      attemptCount++;
      if (attemptCount === 1) {
        return route.abort('failed');
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: MOCK_PDF_CONTENT,
      });
    });

    const cvButton = page.getByRole('button', { name: 'CV' });
    const toast = page.getByRole('alert');

    await cvButton.click();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/failed|fehlgeschlagen/i);
    await expect(cvButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await cvButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('Paul_Glaz_CV_EN.pdf');
  });

  test('page remains fully functional during and after download errors', async ({ page }) => {
    await page.route('**/download?file=**', route => route.abort('failed'));

    const cvButton = page.getByRole('button', { name: 'CV' });
    await cvButton.click();

    const toast = page.getByRole('alert');
    await expect(toast).toBeVisible();

    await page.getByTestId('section-contact').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('section-contact')).toBeInViewport();

    const emailLink = page.getByRole('link', { name: /email/i });
    await expect(emailLink).toBeEnabled();

    await expect(cvButton).toBeEnabled();
  });

  test('handles multiple consecutive failures before success', async ({ page, browserName }) => {
    // Skip on Mobile Safari - has issues with rapid downloads after errors
    test.skip(
      browserName === 'webkit',
      'Mobile Safari has issues with rapid downloads after errors',
    );

    let attemptCount = 0;

    await page.route('**/download?file=**', async route => {
      attemptCount++;

      if (attemptCount === 1) {
        return route.abort('failed');
      }
      if (attemptCount === 2) {
        return route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service Unavailable' }),
        });
      }
      if (attemptCount === 3) {
        return route.abort('timedout');
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: MOCK_PDF_CONTENT,
      });
    });

    const cvButton = page.getByRole('button', { name: 'CV' });

    // 1. Network failure
    await cvButton.click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(cvButton).toBeEnabled();
    await page.waitForTimeout(500);

    // 2. 503 error
    await cvButton.click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(cvButton).toBeEnabled();
    await page.waitForTimeout(500);

    // 3. Timeout error
    await cvButton.click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(cvButton).toBeEnabled();
    await page.waitForTimeout(500);

    // 4. Success
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await cvButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('Paul_Glaz_CV_EN.pdf');
    expect(attemptCount).toBe(4);
  });
});

test.describe('Error Recovery Journeys - Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    await mockTurnstile(page);
    await visitPortfolio(page);
  });

  test('concurrent language switch does not interrupt active download', async ({ page }) => {
    const cvButton = page.getByRole('button', { name: 'CV' });

    const downloadPromise = page.waitForEvent('download');
    await cvButton.click();

    await switchLanguage(page, 'DE');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/Paul_Glaz_CV_(EN|DE)\.pdf/);
  });
});
