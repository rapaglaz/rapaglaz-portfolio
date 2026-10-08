import { expect, test } from '@playwright/test';
import { switchLanguage, visitPortfolio } from './utils';

test.describe('Locale Switch Journey', () => {
  for (const [path, lang, heading, label] of [
    ['/', 'en', 'About Me', 'English'],
    ['/en', 'en', 'About Me', 'English'],
    ['/de', 'de', 'Über Mich', 'Deutsch'],
  ]) {
    test(`uses the route language on direct entry to ${path}`, async ({ page }) => {
      await visitPortfolio(page, path);

      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.getByTestId('section-about').locator('h2')).toHaveText(heading);
      await expect(page.getByRole('option', { name: label })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });
  }

  test('keeps language consistent through switching, reload, Back and Forward', async ({
    page,
  }) => {
    await visitPortfolio(page, '/en?source=locale-test#skills');

    await switchLanguage(page, 'DE');

    await expect(page).toHaveURL(/\/de\?source=locale-test#skills$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.getByRole('option', { name: 'Deutsch' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.getByTestId('section-about').locator('h2')).toHaveText('Über Mich');

    await page.goBack();
    await expect(page).toHaveURL(/\/en\?source=locale-test#skills$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByTestId('section-about').locator('h2')).toHaveText('About Me');
    await expect(page.getByRole('option', { name: 'English' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await page.goForward();
    await expect(page).toHaveURL(/\/de\?source=locale-test#skills$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.getByTestId('section-about').locator('h2')).toHaveText('Über Mich');
    await expect(page.getByRole('option', { name: 'Deutsch' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('keeps English selected when German translations cannot be loaded', async ({ page }) => {
    await visitPortfolio(page, '/?source=locale-test#skills');
    await page.route('**/i18n/de.json', route => route.fulfill({ status: 503, body: '' }));

    await page.getByRole('option', { name: 'Deutsch' }).click();

    await expect(page).toHaveURL(/\/en\?source=locale-test#skills$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByTestId('section-about').locator('h2')).toHaveText('About Me');
    await expect(page.getByRole('option', { name: 'English' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('option', { name: 'Deutsch' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

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
