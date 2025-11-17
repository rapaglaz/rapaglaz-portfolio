import { expect, test } from '@playwright/test';
import { visitPortfolio } from './utils';

test.describe('Responsive Layout', () => {
  test('user can interact with portfolio on mobile without layout issues', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await visitPortfolio(page);

    const navbar = page.locator('nav .container');
    const navbarBox = await navbar.boundingBox();

    expect(navbarBox).toBeTruthy();
    expect(navbarBox!.width).toBeLessThanOrEqual(375);

    await expect(page.locator('app-badge')).toBeVisible();
    await expect(page.getByRole('button', { name: /CV/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /contact/i })).toBeVisible();
    await expect(page.locator('app-language-switcher')).toBeVisible();

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);

    const contactSection = page.getByTestId('section-contact');
    await contactSection.scrollIntoViewIfNeeded();
    await expect(contactSection).toBeInViewport();

    const contactLink = contactSection.locator('a').first();
    await expect(contactLink).toBeVisible();
    const linkBox = await contactLink.boundingBox();
    expect(linkBox).toBeTruthy();
    expect(linkBox!.width).toBeGreaterThan(0);
  });

  test('user experiences optimized layout on tablet and desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await visitPortfolio(page);

    const navbar = page.locator('nav .container');
    const navbarBox = await navbar.boundingBox();

    expect(navbarBox).toBeTruthy();
    expect(navbarBox!.width).toBeLessThanOrEqual(1024);

    const badge = page.locator('app-badge');
    const cvButton = page.getByRole('button', { name: /CV/i });
    const badgeBox = await badge.boundingBox();
    const cvButtonBox = await cvButton.boundingBox();

    expect(badgeBox).toBeTruthy();
    expect(cvButtonBox).toBeTruthy();

    expect(cvButtonBox!.x).toBeGreaterThan(badgeBox!.x + badgeBox!.width);

    const heroSection = page.getByTestId('section-hero');
    const heroBox = await heroSection.boundingBox();
    expect(heroBox).toBeTruthy();
    expect(heroBox!.width).toBeLessThanOrEqual(1024);
  });
});
