import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { provideTranslocoTesting } from '@rapaglaz/shared/testing';
import { SectionWrapper } from '@rapaglaz/shared/ui';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { About } from './about';

describe('About', () => {
  let fixture: ComponentFixture<About>;

  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    TestBed.configureTestingModule({ imports: [About], providers: [provideTranslocoTesting()] });
    fixture = TestBed.createComponent(About);
    fixture.detectChanges();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('shows the title and the description without an entrance animation and a divider', () => {
    const element = fixture.nativeElement as HTMLElement;
    const wrapper = fixture.debugElement.query(By.directive(SectionWrapper))
      .componentInstance as SectionWrapper;

    expect(wrapper.reveal()).toBe(false);
    expect(wrapper.divider()).toBe(false);
    expect(element.querySelector('section > div > div')?.classList.contains('lg:border-t')).toBe(
      false,
    );
    expect(element.querySelector('h2')?.classList.contains('animate-title')).toBe(false);
    expect(element.querySelector('.animate-content')).toBeNull();
    expect(element.querySelector('p')?.textContent).toContain('Frontend Engineer');
  });

  it('updates the heading and description when the active language changes', async () => {
    const transloco = TestBed.inject(TranslocoService);
    await firstValueFrom(transloco.load('de'));

    transloco.setActiveLang('de');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Über mich');
    expect(element.querySelector('p')?.textContent?.trim()).toBe(
      transloco.translate('portfolio.about.description'),
    );
  });
});
