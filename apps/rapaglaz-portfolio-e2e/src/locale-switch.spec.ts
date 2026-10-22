import { expect, test } from '@playwright/test';
import { heroBadge, switchLanguage, tabKey, visitPortfolio } from './utils';

// texts that a direct entry to a route shows in the language of the route
const ROUTE_TEXTS = {
  en: {
    certificationDates: ['December 2022', 'March 2022', 'June 2019'],
    newTab: 'opens in new tab',
    email: 'Email',
    downloadCv: 'Download CV',
  },
  de: {
    certificationDates: ['Dezember 2022', 'März 2022', 'Juni 2019'],
    newTab: 'öffnet in neuem Tab',
    email: 'E-Mail',
    downloadCv: 'CV herunterladen',
  },
};

// the role is English in both languages on purpose; it comes from the key common.role
const PAGE_TITLE = 'Radek Glaz - Senior Frontend Engineer (Angular)';

test.describe('Locale Switch Journey', () => {
  test('uses a horizontal keyboard sequence and preserves focus after changing language', async ({
    page,
    browserName,
  }) => {
    await visitPortfolio(page, '/en?source=keyboard#skills');
    const listbox = page.getByRole('listbox');
    const english = page.getByRole('option', { name: 'English' });
    const german = page.getByRole('option', { name: 'Deutsch' });
    await expect(listbox).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(listbox).toHaveAccessibleName('Language selection');
    await expect(english).toHaveAttribute('lang', 'en');
    await expect(german).toHaveAttribute('lang', 'de');

    const tab = tabKey(browserName);
    await page.getByTestId('cv-download-btn').focus();
    await page.keyboard.press(tab);
    await expect(page.getByRole('button', { name: 'Contact Me' })).toBeFocused();
    await page.keyboard.press(tab);
    await expect(english).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(german).toBeFocused();
    expect(
      await german.evaluate(option => Number.parseFloat(getComputedStyle(option).outlineWidth)),
    ).toBeGreaterThan(0);
    await expect(english).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/de\?source=keyboard#skills$/);
    await expect(german).toBeFocused();
    await expect(listbox).toHaveAccessibleName('Sprachauswahl');
    await page.keyboard.press('ArrowRight');
    await expect(english).toBeFocused();
    await page.keyboard.press('Space');

    await expect(page).toHaveURL(/\/en\?source=keyboard#skills$/);
    await expect(english).toBeFocused();
    await expect(listbox).toHaveAccessibleName('Language selection');
  });

  for (const [path, lang, heading, label] of [
    ['/', 'en', 'About Me', 'English'],
    ['/en', 'en', 'About Me', 'English'],
    ['/de', 'de', 'Über mich', 'Deutsch'],
  ] as const) {
    test(`uses the route language on direct entry to ${path}`, async ({ page }) => {
      const texts = ROUTE_TEXTS[lang];
      await visitPortfolio(page, path);

      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page).toHaveTitle(PAGE_TITLE);
      await expect(page.getByTestId('section-about').locator('h2')).toHaveText(heading);
      await expect(page.getByRole('option', { name: label })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(page.getByTestId('certification-card').locator('time')).toHaveText(
        texts.certificationDates,
      );
      const footer = page.locator('app-footer');
      await expect(footer.getByRole('button')).toHaveAccessibleName(texts.email);
      await expect(footer.getByRole('link', { name: 'LinkedIn' })).toHaveAccessibleName(
        `LinkedIn (${texts.newTab})`,
      );
      await expect(footer.getByRole('link', { name: 'GitHub' })).toHaveAccessibleName(
        `GitHub (${texts.newTab})`,
      );
      await expect(page.getByTestId('cv-download-btn')).toHaveAccessibleName(texts.downloadCv);
    });
  }

  test('keeps language consistent through switching, reload, Back and Forward', async ({
    page,
  }) => {
    await visitPortfolio(page, '/en?source=locale-test#skills');

    await switchLanguage(page, 'DE');

    await expect(page).toHaveURL(/\/de\?source=locale-test#skills$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page).toHaveTitle(PAGE_TITLE);
    await expect(page.getByRole('option', { name: 'Deutsch' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByTestId('certification-card').locator('time').first()).toHaveText(
      'Dezember 2022',
    );
    await expect(page.locator('app-footer').getByRole('button')).toHaveAccessibleName('E-Mail');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.getByTestId('section-about').locator('h2')).toHaveText('Über mich');

    await page.goBack();
    await expect(page).toHaveURL(/\/en\?source=locale-test#skills$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByTestId('section-about').locator('h2')).toHaveText('About Me');
    await expect(page.getByRole('option', { name: 'English' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByTestId('certification-card').locator('time').first()).toHaveText(
      'December 2022',
    );
    await expect(page.locator('app-footer').getByRole('button')).toHaveAccessibleName('Email');

    await page.goForward();
    await expect(page).toHaveURL(/\/de\?source=locale-test#skills$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.getByTestId('section-about').locator('h2')).toHaveText('Über mich');
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

  test('switches language for core content', async ({ page, isMobile }) => {
    await visitPortfolio(page);

    const visibleBadge = heroBadge(page, isMobile);

    await expect(visibleBadge).toBeVisible();
    await expect(visibleBadge).toContainText('Open to Work');

    await switchLanguage(page, 'DE');

    await expect(visibleBadge).toContainText('Offen für Jobangebote');
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
