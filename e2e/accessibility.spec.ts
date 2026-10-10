import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { switchLanguage, visitPortfolio } from './utils';

async function waitForHeroAnimations(page: Page): Promise<void> {
  // Measure contrast after fade-in animations reach their final opacity.
  await page.getByTestId('section-hero').evaluate(async hero => {
    await Promise.all(hero.getAnimations({ subtree: true }).map(animation => animation.finished));
  });
}

test.describe('Accessibility', () => {
  test('shows the skip link above the navbar on the first keyboard navigation step', async ({
    page,
    browserName,
  }) => {
    await visitPortfolio(page, '/de');
    const skipLink = page.getByRole('link', { name: 'Zum Hauptinhalt springen' });

    // WebKit on macOS uses Option-Tab to include links in keyboard navigation.
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');

    await expect(skipLink).toBeFocused();
    const isVisibleAboveNavbar = await skipLink.evaluate(link => {
      const rect = link.getBoundingClientRect();
      return (
        rect.width > 1 &&
        rect.height > 1 &&
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= innerHeight &&
        rect.right <= innerWidth &&
        document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === link
      );
    });
    expect(isVisibleAboveNavbar).toBe(true);
  });

  for (const [path, lang, label] of [
    ['/', 'en', 'Skip to main content'],
    ['/en', 'en', 'Skip to main content'],
    ['/de', 'de', 'Zum Hauptinhalt springen'],
  ]) {
    test(`skips navigation without changing the locale at ${path}`, async ({
      page,
      browserName,
    }) => {
      await visitPortfolio(page, `${path}?source=keyboard#skills`);
      await waitForHeroAnimations(page);
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      await page.getByTestId('section-skills').scrollIntoViewIfNeeded();
      const skipLink = page.getByRole('link', { name: label });
      const main = page.locator('#main-content');
      const targetUrl = new URL(`${path}?source=keyboard#main-content`, page.url()).href;

      await skipLink.focus();
      await page.keyboard.press('Enter');

      await expect(page).toHaveURL(targetUrl);
      await expect(main).toBeFocused();
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect
        .poll(() => main.evaluate(content => Math.round(content.getBoundingClientRect().top)))
        .toBe(0);

      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
      await expect
        .poll(() => page.evaluate(() => document.activeElement?.closest('main')?.id))
        .toBe('main-content');
    });
  }

  test('updates the skip link after switching language', async ({ page }) => {
    await visitPortfolio(page, '/en?source=keyboard');
    await switchLanguage(page, 'DE');
    const skipLink = page.getByRole('link', { name: 'Zum Hauptinhalt springen' });

    await expect(skipLink).toHaveAttribute('href', '/de?source=keyboard#main-content');
    await skipLink.focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/de\?source=keyboard#main-content$/);
    await expect(page.locator('#main-content')).toBeFocused();
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  });

  for (const locale of ['en', 'de']) {
    for (const colorScheme of ['light', 'dark'] as const) {
      test(`has no WCAG violations in revealed ${locale} content with the ${colorScheme} theme`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme });
        await visitPortfolio(page, `/${locale}`);
        await waitForHeroAnimations(page);
        await page.evaluate(() => document.fonts.ready.then(() => undefined));

        for (const sectionId of ['about', 'certifications', 'skills', 'languages', 'contact']) {
          const section = page.getByTestId(`section-${sectionId}`);
          await section.scrollIntoViewIfNeeded();
          await expect(section.locator('h2')).toHaveClass(/visible/);
          await section.evaluate(async element => {
            await Promise.all(
              element.getAnimations({ subtree: true }).map(animation => animation.finished),
            );
          });
        }

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }
});
