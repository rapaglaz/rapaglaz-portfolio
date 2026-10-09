import { DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { type Translation, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom, Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../../app.routes';
import { provideTranslocoTesting } from '../../testing';
import { LANG_LABELS } from '../../utils/i18n';
import { LanguageSwitcher } from './language-switcher';

describe('LanguageSwitcher', () => {
  let fixture: ComponentFixture<LanguageSwitcher>;
  let element: HTMLElement;
  let translocoService: TranslocoService;
  let originalDocumentLang: string;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitcher],
      providers: [
        provideTranslocoTesting(),
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSwitcher);
    element = fixture.nativeElement;
    translocoService = TestBed.inject(TranslocoService);
    originalDocumentLang = TestBed.inject(DOCUMENT).documentElement.lang;
    await firstValueFrom(translocoService.load('en'));
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(DOCUMENT).documentElement.lang = originalDocumentLang;
    vi.restoreAllMocks();
  });

  it('shows language options with user-friendly labels', () => {
    const listbox = element.querySelector('[role="listbox"]');
    const options = Array.from(element.querySelectorAll('[role="option"]')) as HTMLElement[];

    expect(listbox).toBeInstanceOf(HTMLElement);
    const labels = options.map(option => option.getAttribute('aria-label'));
    expect(labels).toEqual(expect.arrayContaining(Object.values(LANG_LABELS)));
    options.forEach(option => {
      expect(option.textContent?.trim()).toMatch(/^[A-Z]{2}$/);
    });
  });

  it('exposes the horizontal orientation and each option language', () => {
    expect(element.querySelector('[role="listbox"]')?.getAttribute('aria-orientation')).toBe(
      'horizontal',
    );
    expect(element.querySelector('[aria-label="English"]')?.getAttribute('lang')).toBe('en');
    expect(element.querySelector('[aria-label="Deutsch"]')?.getAttribute('lang')).toBe('de');
  });

  it('translates the listbox label when the active language changes', async () => {
    await firstValueFrom(translocoService.load('de'));
    translocoService.setActiveLang('de');
    await fixture.whenStable();

    expect(element.querySelector('[role="listbox"]')?.getAttribute('aria-label')).toBe(
      'Sprachauswahl',
    );
  });

  it('marks the active language visually', async () => {
    translocoService.setActiveLang('en');

    await vi.waitFor(() => {
      fixture.detectChanges();
      const activeOption = element.querySelector('[role="option"][aria-label="English"]');

      expect(activeOption).toBeInstanceOf(HTMLElement);
      expect(activeOption?.className).toContain('text-primary');
      expect(activeOption?.className).toContain('pointer-events-none');
    });
  });

  it('keeps inactive language selectable', async () => {
    translocoService.setActiveLang('en');

    await vi.waitFor(() => {
      fixture.detectChanges();
      const inactiveOption = element.querySelector('[role="option"][aria-label="Deutsch"]');

      expect(inactiveOption).toBeInstanceOf(HTMLElement);
      expect(inactiveOption?.className).toContain('cursor-pointer');
      expect(inactiveOption?.className).not.toContain('pointer-events-none');
    });
  });

  it('switches language on click and updates styles', async () => {
    translocoService.setActiveLang('en');
    fixture.detectChanges();

    const deOption = element.querySelector(
      '[role="option"][aria-label="Deutsch"]',
    ) as HTMLButtonElement | null;

    expect(deOption).toBeInstanceOf(HTMLButtonElement);
    deOption?.click();
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(translocoService.getActiveLang()).toBe('de');
      expect(TestBed.inject(Router).url).toBe('/de');
      expect(TestBed.inject(DOCUMENT).documentElement.lang).toBe('de');
      const activeOption = element.querySelector('[role="option"][aria-label="Deutsch"]');
      expect(activeOption?.className).toContain('pointer-events-none');
    });
  });

  it('navigates to the new locale and preserves query parameters and the fragment', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/en?source=navbar#skills');
    fixture.detectChanges();

    const deOption = element.querySelector(
      '[role="option"][aria-label="Deutsch"]',
    ) as HTMLButtonElement | null;

    expect(deOption).toBeInstanceOf(HTMLButtonElement);
    deOption?.click();
    fixture.detectChanges();

    await vi.waitFor(() => {
      expect(router.url).toBe('/de?source=navbar#skills');
    });
  });

  it('keeps the committed language selected until translations finish loading', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/en');
    await firstValueFrom(translocoService.load('de'));
    const pendingTranslation = new Subject<Translation>();
    const load = translocoService.load.bind(translocoService);
    const loadSpy = vi
      .spyOn(translocoService, 'load')
      .mockImplementation(lang => (lang === 'de' ? pendingTranslation : load(lang)));
    fixture.detectChanges();

    element.querySelector<HTMLButtonElement>('[aria-label="Deutsch"]')?.click();
    await vi.waitFor(() => expect(loadSpy).toHaveBeenCalledWith('de'));
    fixture.detectChanges();

    expect(router.url).toBe('/en');
    expect(translocoService.getActiveLang()).toBe('en');
    expect(element.querySelector('[aria-label="English"]')?.getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(element.querySelector('[aria-label="Deutsch"]')?.getAttribute('aria-selected')).toBe(
      'false',
    );

    pendingTranslation.next(translocoService.getTranslation('de'));
    pendingTranslation.complete();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/de');
    expect(translocoService.getActiveLang()).toBe('de');
    expect(element.querySelector('[aria-label="Deutsch"]')?.getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('keeps the committed language selected when navigation is cancelled', async () => {
    const router = TestBed.inject(Router);
    router.resetConfig(
      routes.map(route =>
        route.path === 'de' ? { ...route, canActivate: [(): boolean => false] } : route,
      ),
    );
    await router.navigateByUrl('/en');
    fixture.detectChanges();

    element.querySelector<HTMLButtonElement>('[aria-label="Deutsch"]')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/en');
    expect(translocoService.getActiveLang()).toBe('en');
    expect(TestBed.inject(DOCUMENT).documentElement.lang).toBe('en');
    expect(element.querySelector('[aria-label="English"]')?.getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(element.querySelector('[aria-label="Deutsch"]')?.getAttribute('aria-selected')).toBe(
      'false',
    );
  });
});
