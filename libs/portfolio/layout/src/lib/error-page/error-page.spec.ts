import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslocoService } from '@jsverse/transloco';
import { mockWindowLocation, provideTranslocoTesting } from '@rapaglaz/shared/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ErrorPage } from './error-page';

type Kind = 'notFound' | 'failed';

async function show(kind: Kind, lang = 'en', platformId = 'browser'): Promise<HTMLElement> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', component: ErrorPage, data: { kind } }]),
      provideTranslocoTesting(),
      { provide: PLATFORM_ID, useValue: platformId },
    ],
  });
  const transloco = TestBed.inject(TranslocoService);
  await firstValueFrom(transloco.load(lang));
  transloco.setActiveLang(lang);

  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/anything', ErrorPage);
  harness.detectChanges();
  return harness.routeNativeElement as HTMLElement;
}

describe('ErrorPage', () => {
  const head = document.head;

  beforeEach(() => {
    head.insertAdjacentHTML('beforeend', '<meta name="robots" content="index, follow">');
    document.title = 'Radek Glaz - Senior Frontend Engineer (Angular)';
  });

  afterEach(() => head.querySelectorAll('meta[name="robots"]').forEach(tag => tag.remove()));

  it('tells the visitor that the page does not exist and links back to the portfolio', async () => {
    const element = await show('notFound');

    expect(element.querySelector('h1')?.textContent).toContain('Page not found');
    expect(element.querySelector('[data-testid="error-message"]')?.textContent).toContain(
      'does not exist',
    );
    expect(element.querySelector('[data-testid="error-home"]')?.getAttribute('href')).toBe('/en');
    expect(element.querySelector('[data-testid="error-reload"]')).toBeNull();
  });

  it('offers a reload next to the way home when something went wrong', async () => {
    const element = await show('failed');
    const { reloadMock, cleanup } = mockWindowLocation();

    try {
      element.querySelector<HTMLButtonElement>('[data-testid="error-reload"]')?.click();

      expect(element.querySelector('h1')?.textContent).toContain('Something went wrong');
      expect(element.querySelector('[data-testid="error-home"]')?.getAttribute('href')).toBe('/en');
      expect(reloadMock).toHaveBeenCalledOnce();
    } finally {
      cleanup();
    }
  });

  it('goes home instead of reloading when the address bar shows the error page itself', async () => {
    const element = await show('failed');
    // the route of the harness is /anything, so a bar with that path means a direct visit
    const { assignMock, reloadMock, cleanup } = mockWindowLocation('/anything');

    try {
      element.querySelector<HTMLButtonElement>('[data-testid="error-reload"]')?.click();

      expect(assignMock).toHaveBeenCalledExactlyOnceWith('/en');
      expect(reloadMock).not.toHaveBeenCalled();
    } finally {
      cleanup();
    }
  });

  it('goes to the German home page from the error page in German', async () => {
    const element = await show('failed', 'de');
    const { assignMock, cleanup } = mockWindowLocation('/anything');

    try {
      element.querySelector<HTMLButtonElement>('[data-testid="error-reload"]')?.click();

      expect(assignMock).toHaveBeenCalledExactlyOnceWith('/de');
    } finally {
      cleanup();
    }
  });

  it('does not reload on the server', async () => {
    const element = await show('failed', 'en', 'server');
    const { reloadMock, cleanup } = mockWindowLocation();

    try {
      element.querySelector<HTMLButtonElement>('[data-testid="error-reload"]')?.click();

      expect(reloadMock).not.toHaveBeenCalled();
    } finally {
      cleanup();
    }
  });

  it('writes the page and the link in German when German is active', async () => {
    const element = await show('notFound', 'de');

    expect(element.querySelector('h1')?.textContent).toContain('Seite nicht gefunden');
    expect(element.querySelector('[data-testid="error-home"]')?.getAttribute('href')).toBe('/de');
    expect(document.title).toBe('Seite nicht gefunden | Radek Glaz');
  });

  it('puts the heading and noindex into the head while it is shown', async () => {
    await show('failed');

    expect(document.title).toBe('Something went wrong | Radek Glaz');
    expect(head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex');
  });

  it('gives the title and the robots tag back when the page goes away', async () => {
    await show('notFound');

    TestBed.resetTestingModule();

    expect(document.title).toBe('Radek Glaz - Senior Frontend Engineer (Angular)');
    expect(head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'index, follow',
    );
  });

  it('has the main landmark that the skip link points to', async () => {
    const element = await show('notFound');
    const main = element.querySelector('main');

    expect(main?.id).toBe('main-content');
    expect(main?.getAttribute('tabindex')).toBe('-1');
  });
});
