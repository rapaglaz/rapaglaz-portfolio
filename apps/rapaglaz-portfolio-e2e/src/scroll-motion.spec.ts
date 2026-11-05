import { expect, test } from '@playwright/test';
import { visitPortfolio } from './utils';

test.describe('Scroll-driven motion', () => {
  test('ends the page at the footer after the sections slide over the hero', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'the sections slide over the hero only from lg');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await visitPortfolio(page, '/en');
    await expect
      .poll(() =>
        page.locator('main > .sections').evaluate(element => getComputedStyle(element).transform),
      )
      .not.toBe('none');
    await page.evaluate(() => {
      const { body } = document;
      body.style.paddingBottom = '1px';
      void body.offsetHeight;
      body.style.removeProperty('padding-bottom');
      void body.offsetHeight;
    });
    await page.mouse.wheel(0, 10_000);
    await expect
      .poll(() =>
        page.evaluate(
          () => Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight,
        ),
      )
      .toBe(true);
    const gapBelowFooter = await page
      .locator('app-footer footer')
      .evaluate(element => innerHeight - element.getBoundingClientRect().bottom);
    expect(gapBelowFooter).toBeLessThan(1);
  });

  test('moves the curtain at most three times as fast as the scroll', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'the sections slide over the hero only from lg');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await visitPortfolio(page, '/en');
    const curtainTopAt = (top: number): Promise<number> =>
      page.evaluate(async scrollTop => {
        window.scrollTo({ top: scrollTop, behavior: 'instant' });
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return (document.querySelector('main > .sections') as HTMLElement).getBoundingClientRect()
          .top;
      }, top);
    await expect
      .poll(() => curtainTopAt(0))
      .toBeGreaterThan(await page.evaluate(() => innerHeight));

    const step = 40;
    let previous = await curtainTopAt(0);
    const end = await page.evaluate(() => innerHeight * 0.45);
    for (let top = step; top <= end; top += step) {
      const current = await curtainTopAt(top);
      expect((previous - current) / step).toBeLessThanOrEqual(3);
      previous = current;
    }
  });

  test('moves the navbar badge and fades in the name along with the scroll position', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'the badge and the name are in the navbar only from md');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await visitPortfolio(page, '/en');
    test.skip(
      !(await page.evaluate(() => CSS.supports('animation-timeline: scroll()'))),
      'without scroll-driven animations the class transitions apply',
    );

    const badge = page.getByTestId('hero-badge');
    const name = page.getByTestId('navbar-name');
    const badgeLeftAt = async (share: number): Promise<number> => {
      await page.evaluate(
        scrollTop => {
          window.scrollTo({ top: scrollTop, behavior: 'instant' });
        },
        (await page.evaluate(() => innerHeight)) * share,
      );
      await page.evaluate(
        () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      return badge.evaluate(element => element.getBoundingClientRect().left);
    };

    const start = await badgeLeftAt(0.1);
    const middle = await badgeLeftAt(0.35);
    const end = await badgeLeftAt(0.7);
    expect(middle).toBeGreaterThan(start + 20);
    expect(end).toBeGreaterThan(middle + 20);
    await expect(name).toHaveCSS('opacity', '1');
    await badgeLeftAt(0.1);
    await expect(name).toHaveCSS('opacity', '0');
  });

  for (const { width, height } of [
    { width: 5120, height: 2880 },
    { width: 2160, height: 3840 },
  ]) {
    test(`lands the curtain and shows all sections at the page end on ${width}x${height}`, async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'the sections slide over the hero only from lg');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.setViewportSize({ width, height });
      await visitPortfolio(page, '/en');
      await page.evaluate(() => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
      });

      await expect
        .poll(() =>
          page.locator('main > .sections').evaluate(element => getComputedStyle(element).transform),
        )
        .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
      await expect(page.locator('.sections section h2.visible')).toHaveCount(5);

      const bounds = await page.evaluate(() => ({
        linkBottom: [...document.querySelectorAll('[data-testid="contact-link"]')]
          .at(-1)
          ?.getBoundingClientRect().bottom,
        mainBottom: document.querySelector('main')?.getBoundingClientRect().bottom,
        gapBelowFooter:
          innerHeight -
          (document.querySelector('app-footer footer')?.getBoundingClientRect().bottom ?? 0),
      }));
      expect(bounds.linkBottom).toBeLessThanOrEqual(bounds.mainBottom ?? 0);
      expect(bounds.gapBelowFooter).toBeLessThan(1);
    });
  }

  test('fades the hero before the curtain reaches the avatar', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the sections slide over the hero only from lg');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 2560, height: 1440 });
    await visitPortfolio(page, '/en');

    const opacityAtContact = await page.evaluate(async () => {
      for (let top = 0; top <= innerHeight; top += 8) {
        window.scrollTo({ top, behavior: 'instant' });
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const curtain = document.querySelector('main > .sections') as HTMLElement;
        const avatar = document.querySelector('.hero-avatar > div') as HTMLElement;
        if (curtain.getBoundingClientRect().top <= avatar.getBoundingClientRect().bottom) {
          return Number(
            getComputedStyle(document.querySelector('main > app-hero') as Element).opacity,
          );
        }
      }
      return null;
    });

    expect(opacityAtContact).not.toBeNull();
    expect(opacityAtContact).toBeLessThanOrEqual(0.3);
  });

  test('shows the navbar surface only when the curtain comes near', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the sections slide over the hero only from lg');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 2560, height: 1440 });
    await visitPortfolio(page, '/en');
    test.skip(
      !(await page.evaluate(() => CSS.supports('animation-timeline: scroll()'))),
      'without scroll-driven animations the class transition applies',
    );
    const surface = page.getByTestId('navbar-surface');
    const scrollToShare = (share: number): Promise<void> =>
      page.evaluate(value => {
        window.scrollTo({ top: innerHeight * value, behavior: 'instant' });
      }, share);

    await scrollToShare(0.2);
    await expect(surface).toHaveCSS('opacity', '0');
    await scrollToShare(0.6);
    await expect(surface).toHaveCSS('opacity', '1');
  });

  test('keeps the curtain opaque where two sections meet', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the sections slide over the hero only from lg');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await visitPortfolio(page, '/en');
    const colors = await page.evaluate(() => ({
      curtain: getComputedStyle(document.querySelector('main > .sections') as HTMLElement)
        .backgroundColor,
      section: getComputedStyle(document.getElementById('about') as HTMLElement).backgroundColor,
    }));

    expect(colors.curtain).toBe(colors.section);
    expect(colors.curtain).toMatch(/^rgb\(/);
  });
});
