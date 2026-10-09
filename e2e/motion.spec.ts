import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator } from '@playwright/test';
import { mockInteractiveTurnstile, mockTurnstileAPI, visitPortfolio } from './utils';

async function readMotion(locator: Locator): Promise<{
  opacity: string;
  animationName: string;
  animationDelay: string;
  animationDuration: string;
  transitionDuration: string;
  transform: string;
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
      scale: style.scale,
    };
  });
}

test.describe('Motion preferences', () => {
  test('reveals the decorative hero contours once and keeps them static with reduced motion', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await visitPortfolio(page, '/de');
    const contours = page.locator('.hero-contours');
    await expect(contours).toHaveAttribute('aria-hidden', 'true');
    expect(await contours.evaluate(element => getComputedStyle(element).pointerEvents)).toBe(
      'none',
    );
    expect((await readMotion(contours)).animationName).toContain('hero-contours-enter');
    await expect
      .poll(() =>
        contours.evaluate(element =>
          element.getAnimations().every(a => a.playState === 'finished'),
        ),
      )
      .toBe(true);
    expect((await readMotion(contours)).opacity).toBe('0.3');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await readMotion(contours)).toMatchObject({
      animationName: 'none',
      opacity: '0.3',
      transform: 'none',
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
  });

  test('preserves intentional entrance delays and hover decoration with no preference', async ({
    page,
  }) => {
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
    const cv = page.getByTestId('cv-download-btn');
    await cv.hover();
    if (await page.evaluate(() => matchMedia('(hover: hover)').matches)) {
      await expect.poll(async () => (await readMotion(cv)).scale).toMatch(/1\.15/);
    } else {
      expect((await readMotion(cv)).scale).toBe('none');
    }
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
    await page.locator('#main-content').focus();
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    const contact = page.getByTestId('section-contact').locator('a').first();
    await expect(contact).toBeFocused();
    const focused = await contact.evaluate(element => {
      const ancestors = [];
      let current: Element | null = element;
      while (current && current.tagName !== 'MAIN') {
        ancestors.push(Number(getComputedStyle(current).opacity));
        current = current.parentElement;
      }
      const style = getComputedStyle(element);
      return { opacity: Math.min(...ancestors), outlineWidth: style.outlineWidth };
    });
    expect(focused.opacity).toBe(1);
    expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThan(0);
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
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
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    await expect(page.getByTestId('cv-download-btn')).toBeFocused();
    expect((await readMotion(navbar)).opacity).toBe('1');
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
    expect(await readMotion(toast)).toMatchObject({ opacity: '1', transform: 'none' });
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
      for (const preference of [
        reducedMotion,
        reducedMotion === 'reduce' ? 'no-preference' : 'reduce',
      ] as const) {
        await page.emulateMedia({ reducedMotion: preference });
        const mask = await dots.evaluate(element =>
          decodeURIComponent(getComputedStyle(element).maskImage),
        );
        expect(mask).toContain('<animate');
        expect(mask).toContain('<circle');
        const duration = preference === 'reduce' ? '3s' : '1.05s';
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
