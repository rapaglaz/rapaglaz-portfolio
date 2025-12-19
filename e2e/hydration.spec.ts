import { expect, test } from '@playwright/test';
import { visitPortfolio } from './utils';

const isSSG = process.env['E2E_MODE'] === 'ssg';

test.describe('Hydration (SSG)', () => {
  test.skip(!isSSG, 'Hydration checks run only in SSG mode.');

  test('preserves server-rendered DOM during hydration', async ({ page }) => {
    await page.route('**/*', async route => {
      const request = route.request();
      if (request.resourceType() !== 'document') {
        return route.continue();
      }

      const response = await route.fetch();
      const html = await response.text();
      const updatedHtml = html.replace(
        /(<section\b[^>]*data-testid="section-hero"[^>]*)(>)/,
        '$1 data-hydration-marker="true"$2',
      );

      await route.fulfill({ response, body: updatedHtml });
    });

    await visitPortfolio(page);

    await expect(page.locator('[data-testid="section-hero"]')).toHaveAttribute(
      'data-hydration-marker',
      'true',
    );
  });
});
