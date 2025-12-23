import { expect, test } from '@playwright/test';
import { switchLanguage, visitPortfolio } from './utils';

test.describe('Locale Switch Journey', () => {
  test('switches language for core content', async ({ page }) => {
    await visitPortfolio(page);

    const desktopBadge = page.getByTestId('hero-badge');
    const mobileBadge = page.getByTestId('hero-badge-mobile');

    const visibleBadge = (await desktopBadge.isVisible()) ? desktopBadge : mobileBadge;

    await expect(visibleBadge).toBeVisible();
    await expect(visibleBadge).toContainText('Open to Work');

    await switchLanguage(page, 'DE');

    await expect(visibleBadge).toContainText('Offen für Arbeit');
  });

  test('hides open-to-work badge when flag is disabled', async ({ page }) => {
    await visitPortfolio(page, '/', false);

    const badge = page.locator('[data-testid="hero-badge"], [data-testid="hero-badge-mobile"]');
    await expect(badge).toHaveCount(0);
  });

  test('shows navbar badge on desktop and hides hero badge', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('Mobile'), 'desktop-only check');

    await visitPortfolio(page);

    await expect(page.getByTestId('hero-badge')).toBeVisible();
    await expect(page.getByTestId('hero-badge-mobile')).toBeHidden();
  });

  test('shows hero badge on mobile and hides navbar badge', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.includes('Mobile'), 'mobile-only check');

    await visitPortfolio(page);

    await expect(page.getByTestId('hero-badge-mobile')).toBeVisible();
    await expect(page.getByTestId('hero-badge')).toBeHidden();
  });
});
