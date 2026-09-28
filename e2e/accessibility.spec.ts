import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { visitPortfolio } from './utils';

async function waitForHeroAnimations(page: Page): Promise<void> {
  // Measure contrast after fade-in animations reach their final opacity.
  await page.getByTestId('section-hero').evaluate(async hero => {
    await Promise.all(hero.getAnimations({ subtree: true }).map(animation => animation.finished));
  });
}

test.describe('Accessibility', () => {
  test('has no critical a11y violations on page load', async ({ page }) => {
    await visitPortfolio(page);
    await waitForHeroAnimations(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
