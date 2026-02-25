import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CvDownloadService, FeatureFlagService, ToastService } from '../../services';
import { LoggerService } from '../../services/logger/logger.service';
import { provideTranslocoTesting } from '../../testing';
import { Navbar } from './navbar';

const mockFeatureFlagService = {
  getFlag$: vi.fn().mockReturnValue(of(true)),
  getFlagSignal: vi.fn().mockReturnValue({
    flag: () => true,
    isLoaded: () => true,
  }),
};

describe('Navbar', () => {
  let fixture: ComponentFixture<Navbar>;

  beforeEach(async () => {
    const scrollSubject = new Subject<void>();

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
});

describe('Navbar - CV Download', () => {
  let fixture: ComponentFixture<Navbar>;
  let element: HTMLElement;
  let mockCvDownloadService: { downloadCV: ReturnType<typeof vi.fn> };
  let mockToastService: { error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    const mockScrollDispatcher = {
      scrolled: vi.fn().mockReturnValue(new Subject<void>().asObservable()),
    };

    mockCvDownloadService = {
      downloadCV: vi.fn().mockReturnValue(of(void 0)),
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
        { provide: CvDownloadService, useValue: mockCvDownloadService },
        { provide: ToastService, useValue: mockToastService },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
        { provide: LoggerService, useValue: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('disables button during download and re-enables on completion', async () => {
    const download$ = new Subject<void>();
    mockCvDownloadService.downloadCV.mockReturnValue(download$.asObservable());

    const btn = element.querySelector<HTMLButtonElement>('[data-testid="cv-download-btn"]')!;

    expect(btn.disabled).toBe(false);

    btn.click();
    fixture.detectChanges();
    expect(btn.disabled).toBe(true);

    download$.complete();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(btn.disabled).toBe(false);
    });
  });

  it('re-enables button and shows toast on download failure', async () => {
    mockCvDownloadService.downloadCV.mockReturnValue(
      throwError(() => new Error('Download failed')),
    );

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
    mockCvDownloadService.downloadCV.mockReturnValue(download$.asObservable());

    const btn = element.querySelector<HTMLButtonElement>('[data-testid="cv-download-btn"]')!;

    btn.click();
    btn.click();
    btn.click();

    expect(mockCvDownloadService.downloadCV).toHaveBeenCalledOnce();

    download$.complete();
  });
});
