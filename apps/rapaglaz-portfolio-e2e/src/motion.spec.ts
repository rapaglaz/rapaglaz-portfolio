import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { mockInteractiveTurnstile, mockTurnstileAPI, tabKey, visitPortfolio } from './utils';

// a mouse or a trackpad; a touch screen matches neither part
const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const CAN_HOVER = '(hover: hover)';

// duration of the loading dot animation for each motion preference
const LOADING_DOT_DURATION = { 'no-preference': '1.05s', reduce: '3s' } as const;
const OTHER_PREFERENCE = { 'no-preference': 'reduce', reduce: 'no-preference' } as const;

async function readMotion(locator: Locator): Promise<{
  opacity: string;
  animationName: string;
  animationDelay: string;
  animationDuration: string;
  transitionDuration: string;
  transform: string;
  translate: string;
  scale: string;
}> {
  return locator.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      opacity: style.opacity,
      animationName: style.animationName,
      animationDelay: style.animationDelay,
      animationDuration: style.animationDuration,
      transitionDuration: style.transitionDuration,
      transform: style.transform,
      translate: style.translate,
      scale: style.scale,
    };
  });
}

// opens /de with motion and waits until the first contact link has finished its entrance
async function revealFirstContactLink(
  page: Page,
): Promise<{ links: Locator; first: Locator; surface: Locator }> {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await visitPortfolio(page, '/de');
  const links = page.getByTestId('contact-link');
  const first = links.first();
  await first.scrollIntoViewIfNeeded();
  await expect(first).toHaveClass(/visible/);
  await first.evaluate(element =>
    Promise.all(element.getAnimations().map(animation => animation.finished)),
  );
  return { links, first, surface: first.locator('.contact-card-surface') };
}

async function matchesMedia(page: Page, query: string): Promise<boolean> {
  return page.evaluate(media => matchMedia(media).matches, query);
}

test.describe('Motion preferences', () => {
  test('lifts contact links on keyboard focus and keeps them still with reduced motion', async ({
    page,
    browserName,
  }) => {
    const { links, first, surface } = await revealFirstContactLink(page);
    const tab = tabKey(browserName);
    // every section title is a button and comes first in the tab order, so start at the one before contact
    await page.getByTestId('section-languages').getByRole('button').focus();
    await page.keyboard.press(tab);
    await expect(page.getByTestId('section-contact').getByRole('button')).toBeFocused();
    await page.keyboard.press(tab);
    await expect(first).toBeFocused();
    await expect.poll(async () => (await readMotion(surface)).translate).toBe('0px -4px');
    await expect
      .poll(() => surface.evaluate(element => getComputedStyle(element, '::after').opacity))
      .toBe('1');
    expect(
      await first.evaluate(element => Number.parseFloat(getComputedStyle(element).outlineWidth)),
    ).toBeGreaterThan(0);
    await page.keyboard.press(tab);
    await expect(links.nth(1)).toBeFocused();
    await expect.poll(async () => (await readMotion(surface)).translate).toBe('none');
    const nextSurface = links.nth(1).locator('.contact-card-surface');
    await expect.poll(async () => (await readMotion(nextSurface)).translate).toBe('0px -4px');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await readMotion(nextSurface)).toMatchObject({
      translate: 'none',
      transitionDuration: '0s',
      opacity: '1',
    });
    await first.hover();
    expect((await readMotion(surface)).translate).toBe('none');
  });

  test('lifts contact links on hover with a fine pointer', async ({ page, isMobile }) => {
    test.skip(isMobile, 'a touch screen has no fine pointer');
    const { first, surface } = await revealFirstContactLink(page);
    expect(await matchesMedia(page, FINE_POINTER)).toBe(true);
    const readBounds = (): Promise<{ x: number; y: number; width: number; height: number }> =>
      first.evaluate(element => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x: x + scrollX, y: y + scrollY, width, height };
      });
    const stableBounds = await readBounds();
    await first.hover();
    await expect.poll(async () => (await readMotion(surface)).translate).toBe('0px -4px');
    // the pointer stays on the bottom edge while the surface lifts, so the hover must not flicker
    await first.hover({ position: { x: stableBounds.width / 2, y: stableBounds.height - 1 } });
    await expect.poll(() => first.evaluate(element => element.matches(':hover'))).toBe(true);
    await expect.poll(async () => (await readMotion(surface)).translate).toBe('0px -4px');
    expect(await readBounds()).toEqual(stableBounds);
  });

  test('keeps contact links still on hover without a fine pointer', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'a desktop browser has a fine pointer');
    const { first, surface } = await revealFirstContactLink(page);
    expect(await matchesMedia(page, FINE_POINTER)).toBe(false);
    await first.hover();
    expect((await readMotion(surface)).translate).toBe('none');
  });

  test('preserves intentional entrance delays with no preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await visitPortfolio(page, '/de');
    expect(await readMotion(page.getByTestId('navbar'))).toMatchObject({
      animationName: 'fadeIn',
      animationDuration: '0.7s',
      animationDelay: '0.6s',
    });
    expect(await readMotion(page.locator('.hero-about'))).toMatchObject({
      animationName: 'fadeInUp',
      animationDuration: '1.1s',
      animationDelay: '0.9s',
    });
    expect(
      await page.locator('html').evaluate(element => getComputedStyle(element).scrollBehavior),
    ).toBe('smooth');
  });

  test('scales the CV button on hover where the device can hover', async ({ page, isMobile }) => {
    test.skip(isMobile, 'a touch screen cannot hover');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await visitPortfolio(page, '/de');
    expect(await matchesMedia(page, CAN_HOVER)).toBe(true);
    const cv = page.getByTestId('cv-download-btn');
    await cv.hover();
    await expect.poll(async () => (await readMotion(cv)).scale).toMatch(/1\.15/);
  });

  test('keeps the CV button size on hover where the device cannot hover', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'a desktop browser can hover');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await visitPortfolio(page, '/de');
    expect(await matchesMedia(page, CAN_HOVER)).toBe(false);
    const cv = page.getByTestId('cv-download-btn');
    await cv.hover();
    expect((await readMotion(cv)).scale).toBe('none');
  });

  for (const locale of ['en', 'de']) {
    test(`shows ${locale} content without motion or delay when reduced motion is requested`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await visitPortfolio(page, `/${locale}`);
      expect(
        await page.locator('html').evaluate(element => getComputedStyle(element).scrollBehavior),
      ).toBe('auto');
      const animated = page.locator(
        'nav, .hero-avatar, .hero-name, .hero-about, .animate-title, .animate-content, .animate-container, .animate-item, .animate-pill, .animate-cert',
      );
      expect(await animated.count()).toBeGreaterThan(10);
      for (const element of await animated.all()) {
        expect(await readMotion(element)).toMatchObject({
          opacity: '1',
          animationDelay: '0s',
          animationName: 'none',
          transform: 'none',
        });
      }
      for (const control of [
        page.getByTestId('cv-download-btn'),
        page.getByRole('option', { name: locale === 'en' ? 'Deutsch' : 'English' }),
        page.locator('app-footer').getByRole('link', { name: 'GitHub' }),
      ]) {
        await control.hover();
        const { scale, transform, transitionDuration } = await readMotion(control);
        expect(['none', '1']).toContain(scale);
        expect(transform).toBe('none');
        expect(transitionDuration).toBe('0s');
      }
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test('applies reduced motion after the page has loaded', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await visitPortfolio(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await readMotion(page.locator('.hero-about'))).toMatchObject({
      opacity: '1',
      animationName: 'none',
      animationDelay: '0s',
    });
    expect(
      await readMotion(page.getByTestId('section-contact').locator('a').first()),
    ).toMatchObject({
      opacity: '1',
      animationName: 'none',
      animationDelay: '0s',
    });
  });

  test('shows a contact link and its container immediately when reached with Tab', async ({
    page,
    browserName,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await visitPortfolio(page, '/de');
    // every section title is a button and comes first in the tab order, so start at the one before contact
    await page.getByTestId('section-languages').getByRole('button').focus();
    await page.keyboard.press(tabKey(browserName));
    await expect(page.getByTestId('section-contact').getByRole('button')).toBeFocused();
    await page.keyboard.press(tabKey(browserName));
    const contact = page.getByTestId('section-contact').locator('a').first();
    await expect(contact).toBeFocused();
    const focused = await contact.evaluate(element => {
      const ancestors = [];
      let current: Element | null = element;
      // Stop at the section: above it, small screens fade the page by scroll position, which is
      // still changing while the browser scrolls the focused link into view.
      while (current) {
        ancestors.push(Number(getComputedStyle(current).opacity));
        if (current.tagName === 'SECTION') {
          break;
        }
        current = current.parentElement;
      }
      const style = getComputedStyle(element);
      return { opacity: Math.min(...ancestors), outlineWidth: style.outlineWidth };
    });
    expect(focused.opacity).toBe(1);
    expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThan(0);
    await page.keyboard.press(tabKey(browserName));
    await expect(page.getByTestId('section-contact').locator('a').nth(1)).toBeFocused();
    expect((await readMotion(contact)).opacity).toBe('1');
    await expect(page.getByTestId('section-contact').locator('a').nth(2)).not.toHaveClass(
      /reveal-on-focus/,
    );
  });

  test('keeps a navbar action visible when focused during its entrance delay', async ({
    page,
    browserName,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await visitPortfolio(page, '/en');
    const navbar = page.getByTestId('navbar');
    await navbar.evaluate(element => {
      for (const animation of element.getAnimations()) {
        animation.pause();
        animation.currentTime = 0;
      }
    });
    await page.getByRole('link', { name: 'Skip to main content' }).focus();
    await page.keyboard.press(tabKey(browserName));
    await expect(page.getByTestId('cv-download-btn')).toBeFocused();
    // WebKit can report the paused animation value for a moment after focus; the animation
    // stays paused, so a navbar that never becomes visible still fails the poll
    await expect.poll(async () => (await readMotion(navbar)).opacity).toBe('1');
  });

  test('keeps the close action visible when focused during the toast entrance animation', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await mockTurnstileAPI(page, 'error');
    await visitPortfolio(page, '/de');
    await page.getByTestId('cv-download-btn').focus();
    await page.keyboard.press('Enter');
    const toast = page.getByTestId('toast');
    await expect(toast).toBeVisible();
    await toast.evaluate(element => {
      for (const animation of element.getAnimations()) {
        animation.pause();
        animation.currentTime = 0;
      }
    });
    await toast.getByRole('button', { name: 'Benachrichtigung schließen' }).focus();
    await expect
      .poll(async () => readMotion(toast))
      .toMatchObject({ opacity: '1', transform: 'none' });
  });

  test('shows an error notification immediately without an entrance animation in reduce mode', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mockTurnstileAPI(page, 'error');
    await visitPortfolio(page, '/de');
    await page.getByTestId('cv-download-btn').focus();
    await page.keyboard.press('Enter');
    const toast = page.getByTestId('toast');
    await expect(toast).toBeVisible();
    expect(await readMotion(toast)).toMatchObject({
      opacity: '1',
      animationName: 'none',
      animationDelay: '0s',
      transform: 'none',
    });
  });

  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    // the indicator must follow a change of the preference while the dialog is open
    const steps = [reducedMotion, OTHER_PREFERENCE[reducedMotion]].map(preference => ({
      preference,
      duration: LOADING_DOT_DURATION[preference],
    }));

    test(`keeps the CV loading indicator readable with ${reducedMotion}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      await mockInteractiveTurnstile(page);
      await visitPortfolio(page, '/de');
      const cv = page.getByTestId('cv-download-btn');
      await cv.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(cv).toHaveAttribute('aria-busy', 'true');
      const dots = cv.locator('.loading-dots');
      await expect(dots).toBeVisible();
      for (const { preference, duration } of steps) {
        await page.emulateMedia({ reducedMotion: preference });
        const mask = await dots.evaluate(element =>
          decodeURIComponent(getComputedStyle(element).maskImage),
        );
        expect(mask).toContain('<animate');
        expect(mask).toContain('<circle');
        expect([...mask.matchAll(/dur='([^']+)'/g)].map(match => match[1])).toEqual([
          duration,
          duration,
          duration,
        ]);
      }
      await page.keyboard.press('Escape');
      await expect(dots).toHaveCount(0);
      await expect(cv).toHaveAttribute('aria-busy', 'false');
    });
  }
});
