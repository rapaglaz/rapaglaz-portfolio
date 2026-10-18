import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mockInteractiveTurnstile, mockTurnstileAPI, visitPortfolio } from './utils';

test.describe('Toast accessibility', () => {
  for (const [locale, colorScheme, closeLabel] of [
    ['en', 'light', 'Close notification'],
    ['de', 'dark', 'Benachrichtigung schließen'],
  ] as const) {
    test(`keeps the ${locale} error available and restores focus after keyboard dismissal`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await mockTurnstileAPI(page, 'error');
      await visitPortfolio(page, `/${locale}`);
      await page.clock.install();
      const cvButton = page.getByTestId('cv-download-btn');
      await cvButton.focus();
      await page.keyboard.press('Enter');
      const toast = page.getByTestId('toast');
      const message = toast.getByRole('alert');
      const close = toast.getByRole('button', { name: closeLabel });
      await expect(message).toHaveAttribute('aria-live', 'assertive');
      await expect(message).toHaveAttribute('aria-atomic', 'true');
      await expect(cvButton).toBeFocused();
      await page.clock.fastForward(60_000);
      await expect(toast).toBeVisible();
      await toast.evaluate(async element => {
        await Promise.all(
          element.getAnimations({ subtree: true }).map(animation => animation.finished),
        );
      });

      const results = await new AxeBuilder({ page })
        .include('[data-testid="toast"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
      await close.focus();
      await expect(close).toBeFocused();
      expect(
        await close.evaluate(button => Number.parseFloat(getComputedStyle(button).outlineWidth)),
      ).toBeGreaterThanOrEqual(2);
      await page.clock.fastForward(60_000);
      await expect(close).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(toast).toHaveCount(0);
      await expect(cvButton).toBeFocused();
    });
  }

  test('returns focus to CV when a notification follows an interactive verification error', async ({
    page,
  }) => {
    await mockInteractiveTurnstile(page);
    await visitPortfolio(page, '/de');
    const cvButton = page.getByTestId('cv-download-btn');
    await cvButton.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await dialog.frameLocator('iframe').getByRole('button', { name: 'Fail verification' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(cvButton).toBeFocused();
    const toast = page.getByTestId('toast');
    await toast.getByRole('button', { name: 'Benachrichtigung schließen' }).focus();
    await page.keyboard.press('Escape');
    await expect(toast).toHaveCount(0);
    await expect(cvButton).toBeFocused();
  });

  test('provides a visible close action in the keyboard order at 320 CSS pixels', async ({
    page,
    browserName,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await mockTurnstileAPI(page, 'error');
    await visitPortfolio(page, '/de');
    const cvButton = page.getByTestId('cv-download-btn');
    await cvButton.focus();
    await page.keyboard.press('Enter');
    const toast = page.getByTestId('toast');
    const close = toast.getByRole('button', { name: 'Benachrichtigung schließen' });
    await expect(close).toBeVisible();
    await toast.evaluate(async element => {
      await Promise.all(
        element.getAnimations({ subtree: true }).map(animation => animation.finished),
      );
    });
    const emptySpaceBlocksPage = await toast.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return !!document
        .elementFromPoint(1, rect.top + rect.height / 2)
        ?.closest('.cdk-overlay-pane');
    });
    expect(emptySpaceBlocksPage).toBe(false);
    const previousAction = page.locator('app-footer').getByRole('link', { name: 'GitHub' });
    await previousAction.focus();
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    await expect(close).toBeFocused();
    const fitsViewport = await close.evaluate(button => {
      const rect = button.getBoundingClientRect();
      return (
        rect.width >= 24 &&
        rect.height >= 24 &&
        rect.left >= 0 &&
        rect.right <= innerWidth &&
        rect.top >= 0 &&
        rect.bottom <= innerHeight &&
        getComputedStyle(button).outlineWidth !== '0px'
      );
    });
    expect(fitsViewport).toBe(true);
    await page.keyboard.press('Escape');
    await expect(toast).toHaveCount(0);
    await expect(previousAction).toBeFocused();
  });
});
