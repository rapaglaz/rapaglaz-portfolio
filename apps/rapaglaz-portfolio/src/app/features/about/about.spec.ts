import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { SectionWrapper } from '../../ui';
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

  it('reveals the description when its section becomes visible', () => {
    const element = fixture.nativeElement as HTMLElement;
    const content = element.querySelector('.animate-content');
    const wrapper = fixture.debugElement.query(By.directive(SectionWrapper))
      .componentInstance as SectionWrapper;
    expect(content?.classList.contains('visible')).toBe(false);

    wrapper.scrollReveal.onVisibilityChange(true);
    fixture.detectChanges();

    expect(content?.classList.contains('visible')).toBe(true);
    expect(content?.textContent).toContain('Frontend Engineer');
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
