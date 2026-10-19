import { DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslocoService, type Translation } from '@jsverse/transloco';
import { LanguageSwitcher } from '@rapaglaz/portfolio/layout';
import { provideTranslocoTesting } from '@rapaglaz/shared/testing';
import { firstValueFrom, Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from './app.routes';

const EN_OPTION = '[aria-label="EN English"]';
const DE_OPTION = '[aria-label="DE Deutsch"]';

// The switcher only navigates; the route resolver loads and activates the language
describe('language switch with the app routes', () => {
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

  it('switches language on click and updates styles', async () => {
    translocoService.setActiveLang('en');
    fixture.detectChanges();

    const deOption = element.querySelector(
      `[role="option"]${DE_OPTION}`,
    ) as HTMLButtonElement | null;

    expect(deOption).toBeInstanceOf(HTMLButtonElement);
    deOption?.click();
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(translocoService.getActiveLang()).toBe('de');
      expect(TestBed.inject(Router).url).toBe('/de');
      expect(TestBed.inject(DOCUMENT).documentElement.lang).toBe('de');
      const activeOption = element.querySelector(`[role="option"]${DE_OPTION}`);
      expect(activeOption?.className).toContain('pointer-events-none');
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

    element.querySelector<HTMLButtonElement>(DE_OPTION)?.click();
    await vi.waitFor(() => expect(loadSpy).toHaveBeenCalledWith('de'));
    fixture.detectChanges();

    expect(router.url).toBe('/en');
    expect(translocoService.getActiveLang()).toBe('en');
    expect(element.querySelector(EN_OPTION)?.getAttribute('aria-selected')).toBe('true');
    expect(element.querySelector(DE_OPTION)?.getAttribute('aria-selected')).toBe('false');

    pendingTranslation.next(translocoService.getTranslation('de'));
    pendingTranslation.complete();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/de');
    expect(translocoService.getActiveLang()).toBe('de');
    expect(element.querySelector(DE_OPTION)?.getAttribute('aria-selected')).toBe('true');
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

    element.querySelector<HTMLButtonElement>(DE_OPTION)?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/en');
    expect(translocoService.getActiveLang()).toBe('en');
    expect(TestBed.inject(DOCUMENT).documentElement.lang).toBe('en');
    expect(element.querySelector(EN_OPTION)?.getAttribute('aria-selected')).toBe('true');
    expect(element.querySelector(DE_OPTION)?.getAttribute('aria-selected')).toBe('false');
  });
});
