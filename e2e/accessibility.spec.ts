import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { visitPortfolio } from './utils';

async function waitForAnimations(page: Page): Promise<void> {
  // Hero animations: fadeInUp with 0.55s delay + 0.5s duration = 1.05s
  // Add buffer for rendering
  await page.waitForTimeout(1200);
}

test.describe('Accessibility', () => {
  test('has no critical a11y violations on page load', async ({ page }) => {
    await visitPortfolio(page);
    await waitForAnimations(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
