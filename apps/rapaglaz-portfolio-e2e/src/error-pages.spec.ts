import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { visitPortfolio } from './utils';

// The static server of the SSG run answers an unknown address with its own 404 page, so the tests
// start on a real page and move on inside the app, like a visitor who follows a stale link.
async function navigateInApp(page: Page, path: string): Promise<void> {
  await page.evaluate(target => {
    history.pushState(null, '', target);
    dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}

async function waitForErrorPage(page: Page): Promise<void> {
  const heading = page.getByTestId('error-heading');
  await heading.waitFor({ state: 'visible' });
  // measure contrast after every entrance animation, also the one of the navbar badge, is done
  await page.evaluate(async () => {
    const finite = document
      .getAnimations()
      .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.all(finite.map(animation => animation.finished));
  });
}

test.describe('Error pages', () => {
  for (const [start, path, lang, heading, home] of [
    ['/en', '/en/does-not-exist', 'en', 'Page not found', 'Back to home'],
    ['/de', '/de/does-not-exist', 'de', 'Seite nicht gefunden', 'Zurück zur Startseite'],
  ]) {
    test(`shows the not-found page in ${lang} and leads back to the portfolio`, async ({
      page,
    }) => {
      await visitPortfolio(page, start);

      await navigateInApp(page, path);

      await expect(page.getByTestId('error-heading')).toHaveText(heading);
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page).toHaveTitle(`${heading} | Radek Glaz`);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
      await expect(page.getByTestId('navbar')).toHaveCount(0);

      await page.getByRole('link', { name: home }).click();

      await expect(page).toHaveURL(new RegExp(`/${lang}$`));
      await expect(page.getByTestId('section-hero')).toBeVisible();
      await expect(page.getByTestId('navbar')).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute('content', 'noindex');
    });
  }

  for (const [start, path, lang, heading, home] of [
    ['/en', '/error', 'en', 'Something went wrong', 'Back to home'],
    ['/de', '/de/error', 'de', 'Etwas ist schiefgelaufen', 'Zurück zur Startseite'],
  ]) {
    test(`shows the failed page at ${path} and leads back to the portfolio`, async ({ page }) => {
      await visitPortfolio(page, start);

      await navigateInApp(page, path);

      await expect(page.getByTestId('error-heading')).toHaveText(heading);
      await expect(page.getByRole('button', { name: /reload|neu laden/i })).toHaveCount(0);
      await expect(page.getByRole('link', { name: home })).toHaveAttribute('href', `/${lang}`);
      await expect(page.getByTestId('navbar')).toHaveCount(0);

      await page.getByRole('link', { name: home }).click();

      await expect(page).toHaveURL(new RegExp(`/${lang}$`));
      await expect(page.getByTestId('section-hero')).toBeVisible();
    });
  }

  for (const [path, lang, colorScheme] of [
    ['/en/does-not-exist', 'en', 'light'],
    ['/de/does-not-exist', 'de', 'dark'],
    ['/error', 'en', 'dark'],
    ['/error', 'en', 'light'],
    ['/de/error', 'de', 'light'],
  ] as const) {
    test(`has no WCAG violations at ${path} in ${lang} with the ${colorScheme} theme`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await visitPortfolio(page, `/${lang}`);
      await navigateInApp(page, path);
      await waitForErrorPage(page);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});
