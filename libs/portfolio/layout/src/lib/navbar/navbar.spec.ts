import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { FeatureFlagService, ProtectedDownloadService } from '@rapaglaz/shared/data-access';
import {
  mockWindowLocation,
  mockWindowScrollY,
  provideTranslocoTesting,
} from '@rapaglaz/shared/testing';
import { ToastService } from '@rapaglaz/shared/ui';
import { LoggerService } from '@rapaglaz/shared/util';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Navbar } from './navbar';

const openToWork = signal(true);
const mockFeatureFlagService = {
  getFlag: vi.fn().mockReturnValue({
    value: () => true,
    hasValue: () => true,
    isLoading: () => false,
    error: () => undefined,
  }),
  getFlagValue: vi.fn(() => openToWork.asReadonly()),
};

describe('Navbar', () => {
  let fixture: ComponentFixture<Navbar>;
  let scrollSubject: Subject<void>;

  beforeEach(async () => {
    openToWork.set(true);
    scrollSubject = new Subject<void>();

    const mockScrollDispatcher = {
      scrolled: vi.fn().mockReturnValue(scrollSubject.asObservable()),
    };

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslocoTesting(),
        { provide: ScrollDispatcher, useValue: mockScrollDispatcher },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();
  });

  it('renders navbar with primary actions', () => {
    const element = fixture.nativeElement as HTMLElement;
    const navbar = element.querySelector('nav');
    const badge = element.querySelector('app-badge');
    const languageSwitcher = element.querySelector('app-language-switcher');
    const buttons = Array.from(element.querySelectorAll('button'));
    const iconButton = buttons.find(button => button.getAttribute('aria-label'));

    expect(navbar).toBeInstanceOf(HTMLElement);
    expect(badge).toBeInstanceOf(HTMLElement);
    expect(languageSwitcher).toBeInstanceOf(HTMLElement);
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    expect(iconButton?.getAttribute('aria-label')?.trim()).toBeTruthy();
  });

  it('repeats the name for sighted users only and from md', () => {
    const element = fixture.nativeElement as HTMLElement;
    const name = element.querySelector('[data-testid="navbar-name"]');

    expect(name?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Radek Glaz');
    expect(name?.getAttribute('aria-hidden')).toBe('true');
    expect(name?.classList.contains('hidden')).toBe(true);
    expect(name?.classList.contains('md:block')).toBe(true);
  });

  it.each([
    ['en', 'Download CV'],
    ['de', 'CV herunterladen'],
  ])('names the CV action in %s and includes its visible label', async (lang, label) => {
    const transloco = TestBed.inject(TranslocoService);
    await firstValueFrom(transloco.load(lang));
    transloco.setActiveLang(lang);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="cv-download-btn"]',
    );

    expect(button?.getAttribute('aria-label')).toBe(label);
    expect(label).toContain(button?.textContent?.trim());
  });

  it('opens the configured email address when the contact button is clicked', () => {
    const { assignMock, cleanup } = mockWindowLocation();

    try {
      (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLButtonElement>('button[aria-label="Contact Me"]')!
        .click();

      expect(assignMock).toHaveBeenCalledExactlyOnceWith('mailto:radek@rapaglaz.de');
    } finally {
      cleanup();
    }
  });

  it('updates navbar styling when scrolling away from and back to the top', () => {
    const restoreScrollY = mockWindowScrollY(24);
    const surface = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="navbar-surface"]',
    )!;

    try {
      expect(surface.getAttribute('aria-hidden')).toBe('true');

      scrollSubject.next();
      fixture.detectChanges();
      expect(surface.classList.contains('navbar-scrolled')).toBe(true);

      window.scrollY = 0;
      scrollSubject.next();
      fixture.detectChanges();
      expect(surface.classList.contains('navbar-scrolled')).toBe(false);
    } finally {
      restoreScrollY();
    }
  });

  it('hides the availability badge and updates alignment when the flag is disabled', () => {
    openToWork.set(false);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[data-testid="hero-badge"]')).toBeNull();
    expect(
      element
        .querySelector('[data-testid="navbar-container"]')
        ?.classList.contains('md:justify-end'),
    ).toBe(true);

    openToWork.set(true);
    fixture.detectChanges();
    expect(element.querySelector('[data-testid="hero-badge"]')?.textContent?.trim()).toBe(
      'Open to Work',
    );
  });
});

describe('Navbar - CV Download', () => {
  let fixture: ComponentFixture<Navbar>;
  let element: HTMLElement;
  let mockDownloadService: { download: ReturnType<typeof vi.fn> };
  let mockToastService: { error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    openToWork.set(true);
    const mockScrollDispatcher = {
      scrolled: vi.fn().mockReturnValue(new Subject<void>().asObservable()),
    };

    mockDownloadService = {
      download: vi.fn().mockReturnValue(of(void 0)),
    };

    mockToastService = {
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslocoTesting(),
        { provide: ScrollDispatcher, useValue: mockScrollDispatcher },
        { provide: ProtectedDownloadService, useValue: mockDownloadService },
        { provide: ToastService, useValue: mockToastService },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
        { provide: LoggerService, useValue: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('keeps the busy button focusable and restores its available state on completion', async () => {
    const download$ = new Subject<void>();
    mockDownloadService.download.mockReturnValue(download$.asObservable());

    const btn = element.querySelector<HTMLButtonElement>('[data-testid="cv-download-btn"]')!;

    expect(btn.disabled).toBe(false);

    btn.focus();
    btn.click();
    fixture.detectChanges();
    expect(btn.disabled).toBe(false);
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(document.activeElement).toBe(btn);

    download$.complete();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(btn.disabled).toBe(false);
      expect(btn.getAttribute('aria-disabled')).toBe('false');
      expect(btn.getAttribute('aria-busy')).toBe('false');
      expect(mockToastService.error).not.toHaveBeenCalled();
    });
  });

  it('re-enables button and shows toast on download failure', async () => {
    mockDownloadService.download.mockReturnValue(throwError(() => new Error('Download failed')));

    const btn = element.querySelector<HTMLButtonElement>('[data-testid="cv-download-btn"]')!;
    btn.click();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(btn.disabled).toBe(false);
      expect(mockToastService.error).toHaveBeenCalledOnce();
    });
  });

  it('prevents concurrent download requests', () => {
    const download$ = new Subject<void>();
    mockDownloadService.download.mockReturnValue(download$.asObservable());

    const btn = element.querySelector<HTMLButtonElement>('[data-testid="cv-download-btn"]')!;

    btn.click();
    btn.click();
    btn.click();

    expect(mockDownloadService.download).toHaveBeenCalledOnce();

    download$.complete();
  });

  it.each([
    ['en', 'Radoslaw_Pawel_Glaz_CV-EN.pdf'],
    ['de', 'Radoslaw_Pawel_Glaz_CV-DE.pdf'],
  ])('downloads the CV in the active language %s', (lang, fileName) => {
    TestBed.inject(TranslocoService).setActiveLang(lang);
    const btn = element.querySelector<HTMLButtonElement>('[data-testid="cv-download-btn"]')!;

    btn.click();

    expect(mockDownloadService.download).toHaveBeenCalledExactlyOnceWith(fileName, btn);
  });
});
