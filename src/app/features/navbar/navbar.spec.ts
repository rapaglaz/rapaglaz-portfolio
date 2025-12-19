import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONTACT_ITEMS } from '../../content';
import { CvDownloadService, FeatureFlagService, ToastService } from '../../services';
import { provideTranslocoTesting } from '../../testing';
import { Navbar } from './navbar';

const mockFeatureFlagService = {
  getFlag$: vi.fn().mockReturnValue(of(true)),
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
    const badge = element.querySelector('app-badge [role="button"]');
    const languageSwitcher = element.querySelector('app-language-switcher');
    const buttons = Array.from(element.querySelectorAll('button[appButton]'));
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
        provideTranslocoTesting(),
        { provide: ScrollDispatcher, useValue: mockScrollDispatcher },
        { provide: CvDownloadService, useValue: mockCvDownloadService },
        { provide: ToastService, useValue: mockToastService },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('disables button during download and re-enables on completion', async () => {
    const download$ = new Subject<void>();
    mockCvDownloadService.downloadCV.mockReturnValue(download$.asObservable());

    const btn = element.querySelectorAll('button[appButton]')[0] as HTMLButtonElement;

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

    const btn = element.querySelectorAll('button[appButton]')[0] as HTMLButtonElement;
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

    const btn = element.querySelectorAll('button[appButton]')[0] as HTMLButtonElement;

    btn.click();
    btn.click();
    btn.click();

    expect(mockCvDownloadService.downloadCV).toHaveBeenCalledOnce();

    download$.complete();
  });
});

describe('Navbar - Contact Email', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let element: HTMLElement;

  beforeEach(async () => {
    const mockScrollDispatcher = {
      scrolled: vi.fn().mockReturnValue(new Subject<void>().asObservable()),
    };

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslocoTesting(),
        { provide: ScrollDispatcher, useValue: mockScrollDispatcher },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('uses email href from CONTACT_ITEMS data source', () => {
    const emailItem = CONTACT_ITEMS.find(item => item.id === 'email');

    expect(emailItem).toBeDefined();
    expect(emailItem?.href).toMatch(/^mailto:/);
  });

  it('navigates to mailto link when contact button is clicked', () => {
    const assignSpy = vi.fn();
    const originalLocation = window.location;

    Object.defineProperty(window, 'location', {
      value: { assign: assignSpy },
      writable: true,
      configurable: true,
    });

    // Select the contact button (the one with SVG icon, not the CV button)
    const contactButton = element
      .querySelector('button[appButton] svg')
      ?.closest('button') as HTMLButtonElement | null;
    expect(contactButton).toBeInstanceOf(HTMLButtonElement);
    contactButton?.click();

    const emailItem = CONTACT_ITEMS.find(item => item.id === 'email');
    expect(assignSpy).toHaveBeenCalledWith(emailItem?.href);
    expect(assignSpy).toHaveBeenCalledWith(expect.stringMatching(/^mailto:/));

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it('navigates to mailto link when badge is clicked', () => {
    const assignSpy = vi.fn();
    const originalLocation = window.location;

    Object.defineProperty(window, 'location', {
      value: { assign: assignSpy },
      writable: true,
      configurable: true,
    });

    const badge = element.querySelector('app-badge [role="button"]') as HTMLElement | null;
    expect(badge).toBeInstanceOf(HTMLElement);
    badge?.click();

    const emailItem = CONTACT_ITEMS.find(item => item.id === 'email');
    expect(assignSpy).toHaveBeenCalledWith(emailItem?.href);

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });
});
