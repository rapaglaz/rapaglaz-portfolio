import { expect, test } from '@playwright/test';
import { switchLanguage, visitPortfolio } from './utils';

test.describe('Contact', () => {
  test.beforeEach(async ({ page }) => {
    await visitPortfolio(page);
  });

  test('opens external profile links in new tab', async ({ page, context }) => {
    const contactSection = page.getByTestId('section-contact');
    await contactSection.scrollIntoViewIfNeeded();

    const linkedinLink = contactSection.getByRole('link', { name: /linkedin/i });

    const newPagePromise = context.waitForEvent('page');
    await linkedinLink.click();

    const newPage = await newPagePromise;
    expect(newPage.url()).toContain('linkedin.com');

    await newPage.close();
  });

  test('navigates contact section using keyboard', async ({ page }) => {
    const contactSection = page.getByTestId('section-contact');
    await contactSection.scrollIntoViewIfNeeded();

    const emailLink = contactSection.getByRole('link', { name: /email/i });

    await emailLink.focus();
    await expect(emailLink).toBeFocused();
    await expect(emailLink).toBeVisible();
  });

  test('translates contact labels based on active language', async ({ page }) => {
    const contactSection = page.getByTestId('section-contact');
    await contactSection.scrollIntoViewIfNeeded();

    await expect(contactSection.locator('h3', { hasText: 'Email' })).toBeVisible();

    await switchLanguage(page, 'DE');
    await contactSection.scrollIntoViewIfNeeded();

    await expect(contactSection.locator('h3', { hasText: 'E-Mail' })).toBeVisible();
    await expect(contactSection.getByText('paul@rapaglaz.de')).toBeVisible();
  });
});
