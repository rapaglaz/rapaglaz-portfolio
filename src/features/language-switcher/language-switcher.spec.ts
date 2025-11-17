import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { LanguageSwitcher } from './language-switcher';

describe('LanguageSwitcher', () => {
  let fixture: ComponentFixture<LanguageSwitcher>;
  let element: HTMLElement;
  let translocoService: TranslocoService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitcher],
      providers: [provideZonelessChangeDetection(), provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSwitcher);
    element = fixture.nativeElement;
    translocoService = TestBed.inject(TranslocoService);
    fixture.detectChanges();
  });

  it('renders EN and DE buttons', () => {
    const buttons = element.querySelectorAll('button[type="button"]');
    const buttonTexts = Array.from(buttons).map(btn => btn.textContent?.trim());

    expect(buttonTexts).toContain('EN');
    expect(buttonTexts).toContain('DE');
  });

  it('disables active language button', async () => {
    translocoService.setActiveLang('en');

    await vi.waitFor(() => {
      fixture.detectChanges();
      const buttons = element.querySelectorAll('button[type="button"]');
      const enButton = Array.from(buttons).find(btn =>
        btn.textContent?.includes('EN'),
      ) as HTMLElement;

      expect(enButton?.classList.contains('pointer-events-none')).toBe(true);
      expect(enButton?.classList.contains('font-bold')).toBe(true);
    });
  });

  it('enables inactive language button', async () => {
    translocoService.setActiveLang('en');

    await vi.waitFor(() => {
      fixture.detectChanges();
      const buttons = element.querySelectorAll('button[type="button"]');
      const deButton = Array.from(buttons).find(btn =>
        btn.textContent?.includes('DE'),
      ) as HTMLElement;

      expect(deButton?.className).not.toContain('pointer-events-none');
    });
  });

  it('switches language on click', async () => {
    translocoService.setActiveLang('en');
    fixture.detectChanges();

    const buttons = element.querySelectorAll('button[type="button"]');
    const deButton = Array.from(buttons).find(btn =>
      btn.textContent?.includes('DE'),
    ) as HTMLButtonElement;

    deButton?.click();
    fixture.detectChanges();

    await vi.waitFor(() => {
      expect(translocoService.getActiveLang()).toBe('de');
    });
  });
});
