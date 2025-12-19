import { expect, test } from '@playwright/test';
import { switchLanguage, visitPortfolio } from './utils';

test.describe('Locale Switch Journey', () => {
  test.beforeEach(async ({ page }) => {
    await visitPortfolio(page);
  });

  test('switches language for core content', async ({ page }) => {
    await expect(page.getByTestId('hero-badge')).toContainText('Open to Work');

    await switchLanguage(page, 'DE');

    await expect(page.getByTestId('hero-badge')).toContainText('Offen für Arbeit');
  });
});
