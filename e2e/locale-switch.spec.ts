import { expect, test } from '@playwright/test';
import { switchLanguage, visitPortfolio } from './utils';

test.describe('Locale Switch Journey', () => {
  test.beforeEach(async ({ page }) => {
    await visitPortfolio(page);
  });

  test('switches language bidirectionally', async ({ page }) => {
    await expect(page.getByTestId('section-about').locator('h2')).toContainText('ABOUT ME');
    await expect(page.getByTestId('section-skills').locator('h2')).toContainText('SKILLS');
    await expect(page.locator('app-badge')).toContainText('Open to Work');

    await switchLanguage(page, 'DE');

    await expect(page.getByTestId('section-about').locator('h2')).toContainText('ÜBER MICH');
    await expect(page.getByTestId('section-skills').locator('h2')).toContainText('FÄHIGKEITEN');
    await expect(page.locator('app-badge')).toContainText('Offen für Arbeit');

    await switchLanguage(page, 'EN');

    await expect(page.getByTestId('section-about').locator('h2')).toContainText('ABOUT ME');
    await expect(page.locator('app-badge')).toContainText('Open to Work');
  });

  test('translates language names', async ({ page }) => {
    await page.getByTestId('section-languages').scrollIntoViewIfNeeded();

    await expect(page.getByText('German')).toBeVisible();
    await expect(page.getByText('English')).toBeVisible();
    await expect(page.getByText('Polish')).toBeVisible();

    await switchLanguage(page, 'DE');

    await expect(page.getByText('Deutsch')).toBeVisible();
    await expect(page.getByText('Englisch')).toBeVisible();
    await expect(page.getByText('Polnisch')).toBeVisible();
  });
});
