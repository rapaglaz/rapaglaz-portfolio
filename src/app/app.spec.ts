import { DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { routes } from './app.routes';
import { provideTranslocoTesting } from './testing';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslocoTesting(),
      ],
    }).compileComponents();

    await firstValueFrom(TestBed.inject(TranslocoService).load('en'));

    fixture = TestBed.createComponent(App);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders without errors', () => {
    const outlet = element.querySelector('router-outlet');

    expect(outlet).toBeInstanceOf(HTMLElement);
  });

  it.each([
    ['/', 'Skip to main content'],
    ['/en', 'Skip to main content'],
    ['/de', 'Zum Hauptinhalt springen'],
  ])('puts a localized skip link before navigation at %s', async (path, label) => {
    await TestBed.inject(Router).navigateByUrl(`${path}?source=keyboard#skills`);
    fixture.detectChanges();
    const skipLink = element.querySelector<HTMLAnchorElement>('a[href$="#main-content"]');

    expect(skipLink).toBeInstanceOf(HTMLAnchorElement);
    expect(skipLink?.textContent?.trim()).toBe(label);
    expect(skipLink?.getAttribute('href')).toBe(`${path}?source=keyboard#main-content`);
    expect(element.querySelector('a, button, [tabindex="0"]')).toBe(skipLink);
  });

  it('moves focus to the main content while retaining the locale and query parameters', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/de?source=keyboard#skills');
    fixture.detectChanges();
    const main = element.querySelector<HTMLElement>('#main-content');
    expect(main).toBeInstanceOf(HTMLElement);
    if (!main) {
      throw new Error('Main content was not rendered');
    }
    main.scrollIntoView = vi.fn();

    element.querySelector<HTMLAnchorElement>('a[href$="#main-content"]')?.click();
    expect(TestBed.inject(DOCUMENT).activeElement).toBe(main);
    await vi.waitFor(() => expect(router.url).toBe('/de?source=keyboard#main-content'));
    expect(TestBed.inject(TranslocoService).getActiveLang()).toBe('de');
  });

  it.each([
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { altKey: true },
    { button: 1 },
  ])('preserves the current focus for a modified click: %o', async modifiers => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/de');
    fixture.detectChanges();
    const main = element.querySelector<HTMLElement>('#main-content');
    const skipLink = element.querySelector<HTMLAnchorElement>('a[href$="#main-content"]');
    expect(main).toBeInstanceOf(HTMLElement);
    expect(skipLink).toBeInstanceOf(HTMLAnchorElement);
    if (!main || !skipLink) {
      throw new Error('Skip link or main content was not rendered');
    }
    main.scrollIntoView = vi.fn();
    skipLink.focus();
    const event = new MouseEvent('click', { ...modifiers, bubbles: true, cancelable: true });
    event.preventDefault();

    skipLink.dispatchEvent(event);

    expect(TestBed.inject(DOCUMENT).activeElement).toBe(skipLink);
    expect(router.url).toBe('/de');
  });
});
