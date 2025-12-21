import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { LANG_LABELS } from '../../utils/i18n';
import { LanguageSwitcher } from './language-switcher';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class DummyRouteComponent {}

describe('LanguageSwitcher', () => {
  let fixture: ComponentFixture<LanguageSwitcher>;
  let element: HTMLElement;
  let translocoService: TranslocoService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitcher],
      providers: [
        provideTranslocoTesting(),
        provideRouter([
          { path: 'en', component: DummyRouteComponent },
          { path: 'de', component: DummyRouteComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSwitcher);
    element = fixture.nativeElement;
    translocoService = TestBed.inject(TranslocoService);
    fixture.detectChanges();
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
      expect(translocoService.getActiveLang()).toBe('de');
      const activeOption = element.querySelector('[role="option"][aria-label="Deutsch"]');
      expect(activeOption?.className).toContain('pointer-events-none');
    });
  });

  it('navigates to the new locale and preserves the fragment', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/en#skills');
    fixture.detectChanges();

    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const deOption = element.querySelector(
      '[role="option"][aria-label="Deutsch"]',
    ) as HTMLButtonElement | null;

    expect(deOption).toBeInstanceOf(HTMLButtonElement);
    deOption?.click();
    fixture.detectChanges();

    await vi.waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(['/', 'de'], { fragment: 'skills' });
    });
  });
});
