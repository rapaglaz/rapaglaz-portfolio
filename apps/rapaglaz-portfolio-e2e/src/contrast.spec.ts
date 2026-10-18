import { expect, test, type Locator } from '@playwright/test';
import { mockTurnstileAPI, visitPortfolio } from './utils';

type Color = readonly number[];

function blend(foreground: Color, background: Color): Color {
  return foreground
    .slice(0, 3)
    .map((value, index) => value * foreground[3] + background[index] * (1 - foreground[3]));
}

function contrast(foreground: Color, background: Color): number {
  const luminance = (color: Color): number =>
    color.slice(0, 3).reduce((total, value, index) => {
      const channel = value / 255;
      const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      return total + linear * [0.2126, 0.7152, 0.0722][index];
    }, 0);
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

async function readColors(
  locator: Locator,
  pairs: { foreground: string; background?: string }[],
): Promise<{ foreground: Color; background: Color; outlineWidth: number }[]> {
  return locator.evaluate((element, properties) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d')!;
    const readColor = (value: string): number[] => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const rgba = Array.from(context.getImageData(0, 0, 1, 1).data);
      return [...rgba.slice(0, 3), rgba[3] / 255];
    };
    const style = getComputedStyle(element);
    let surface: Element | null = element;
    let background = [0, 0, 0, 0];
    while (surface && background[3] === 0) {
      background = readColor(getComputedStyle(surface).backgroundColor);
      surface = surface.parentElement;
    }
    return properties.map(pair => ({
      foreground: readColor(style.getPropertyValue(pair.foreground).trim()),
      background: pair.background
        ? readColor(style.getPropertyValue(pair.background).trim())
        : background,
      outlineWidth: Number.parseFloat(style.outlineWidth),
    }));
  }, pairs);
}

async function waitForAnimations(locator: Locator): Promise<void> {
  await locator.evaluate(async element => {
    await Promise.all(
      element.getAnimations({ subtree: true }).map(animation => animation.finished),
    );
  });
}

function expectContrastOnUnderlays(
  colors: { foreground: Color; background: Color },
  minimum: number,
  label: string,
): void {
  for (const underlay of [
    [0, 0, 0],
    [255, 255, 255],
  ]) {
    const background = blend(colors.background, underlay);
    const foreground = blend(colors.foreground, background);
    expect
      .soft(contrast(foreground, background), `${label} over ${underlay}`)
      .toBeGreaterThanOrEqual(minimum);
  }
}

test.describe('Theme contrast', () => {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`keeps ${colorScheme} theme content pairs above the normal-text minimum`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await visitPortfolio(page);
      const names = [
        'primary',
        'secondary',
        'accent',
        'neutral',
        'info',
        'success',
        'warning',
        'error',
      ];
      const pairs = [
        ...names.map(name => ({
          foreground: `--color-${name}-content`,
          background: `--color-${name}`,
        })),
        ...['base-content', 'text-muted', 'text-subtle'].flatMap(name =>
          ['base-100', 'base-200'].map(background => ({
            foreground: `--color-${name}`,
            background: `--color-${background}`,
          })),
        ),
      ];
      const colors = await readColors(page.locator('html'), pairs);
      colors.forEach((pair, index) => {
        expect
          .soft(contrast(pair.foreground, pair.background), JSON.stringify(pairs[index]))
          .toBeGreaterThanOrEqual(4.5);
      });
    });

    test(`keeps ${colorScheme} navbar text and focus contrasting with the page beneath it`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await visitPortfolio(page);
      await waitForAnimations(page.getByTestId('navbar'));
      const actions = [
        {
          locator: page.getByTestId('cv-download-btn'),
          states: ['normal', 'hover', 'focus'],
          minimum: 4.5,
        },
        {
          locator: page.getByRole('option', { name: 'Deutsch' }),
          states: ['normal', 'hover', 'focus'],
          minimum: 4.5,
        },
        {
          locator: page.getByRole('option', { name: 'English' }),
          states: ['normal', 'focus'],
          minimum: 4.5,
        },
        {
          locator: page.getByRole('button', { name: 'Contact Me' }),
          states: ['normal', 'hover', 'focus'],
          minimum: 3,
        },
      ];
      for (const action of actions) {
        for (const state of action.states) {
          if (state === 'hover') await action.locator.hover();
          if (state === 'focus') await action.locator.focus();
          await waitForAnimations(action.locator);
          const [text, outline] = await readColors(action.locator, [
            { foreground: 'color' },
            { foreground: 'outline-color' },
          ]);
          expectContrastOnUnderlays(text, action.minimum, `${state} action`);
          if (state === 'focus') {
            expect(outline.outlineWidth).toBeGreaterThan(0);
            expectContrastOnUnderlays(outline, 3, 'focus indicator');
          }
        }
        await page.mouse.move(0, 0);
      }
    });

    test(`keeps ${colorScheme} footer icons and focus visible`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await visitPortfolio(page);
      const footer = page.locator('app-footer');
      const actions = [
        footer.getByRole('button'),
        footer.getByRole('link', { name: 'LinkedIn' }),
        footer.getByRole('link', { name: 'GitHub' }),
      ];
      for (const action of actions) {
        for (const state of ['normal', 'hover', 'focus']) {
          if (state === 'hover') await action.hover();
          if (state === 'focus') await action.focus();
          await waitForAnimations(action);
          const [icon, outline] = await readColors(action, [
            { foreground: 'color' },
            { foreground: 'outline-color' },
          ]);
          expectContrastOnUnderlays(icon, 3, `${state} footer icon`);
          if (state === 'focus') {
            expect(outline.outlineWidth).toBeGreaterThan(0);
            expectContrastOnUnderlays(outline, 3, 'footer focus indicator');
          }
        }
        await page.mouse.move(0, 0);
      }
    });

    test(`keeps ${colorScheme} error text and close action contrasting over page content`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await mockTurnstileAPI(page, 'error');
      await visitPortfolio(page, '/de');
      await waitForAnimations(page.getByTestId('section-hero'));
      await waitForAnimations(page.getByTestId('navbar'));
      await page.getByTestId('cv-download-btn').focus();
      await page.keyboard.press('Enter');
      const toast = page.getByTestId('toast');
      await expect(toast).toBeVisible();
      await waitForAnimations(toast);
      const [message] = await readColors(toast.getByRole('alert'), [{ foreground: 'color' }]);
      expectContrastOnUnderlays(message, 4.5, 'error message');
      const close = toast.getByRole('button', { name: 'Benachrichtigung schließen' });
      await close.focus();
      const [icon, outline] = await readColors(close, [
        { foreground: 'color' },
        { foreground: 'outline-color' },
      ]);
      expectContrastOnUnderlays(icon, 3, 'close icon');
      expect(outline.outlineWidth).toBeGreaterThanOrEqual(2);
      expectContrastOnUnderlays(outline, 3, 'close focus indicator');
    });
  }
});
