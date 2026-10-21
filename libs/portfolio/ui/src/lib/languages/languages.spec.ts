import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { provideTranslocoTesting } from '@rapaglaz/shared/testing';
import { LoggerService } from '@rapaglaz/shared/util';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Languages } from './languages';

describe('Languages', () => {
  let fixture: ComponentFixture<Languages>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Languages],
      providers: [provideTranslocoTesting()],
    });
    fixture = TestBed.createComponent(Languages);
    fixture.detectChanges();
  });

  it('renders language names, proficiency levels and sequential delays', () => {
    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
      '[data-testid="language-card"]',
    );

    expect(Array.from(cards, card => card.querySelector('h3')?.textContent?.trim())).toEqual([
      'German',
      'English',
      'Polish',
    ]);
    expect(cards[0].querySelector('p')?.textContent?.trim()).toBe('Professional Proficiency (C2)');
    expect(cards[2].querySelector('p')?.textContent?.trim()).toBe('Native Speaker');
    expect(Array.from(cards, card => card.style.animationDelay)).toEqual([
      '0.15s',
      '0.2s',
      '0.25s',
    ]);
  });

  it('updates names and proficiency levels after switching language', async () => {
    const transloco = TestBed.inject(TranslocoService);
    await firstValueFrom(transloco.load('de'));

    transloco.setActiveLang('de');
    fixture.detectChanges();

    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
      '[data-testid="language-card"]',
    );
    expect(Array.from(cards, card => card.querySelector('h3')?.textContent?.trim())).toEqual([
      'Deutsch',
      'Englisch',
      'Polnisch',
    ]);
    expect(cards[0].querySelector('p')?.textContent?.trim()).toBe('Verhandlungssicher (C2)');
  });

  it('shows no cards and logs a warning when the translations have the wrong shape', () => {
    fixture.destroy();
    const warn = vi
      .spyOn(TestBed.inject(LoggerService), 'warn')
      .mockImplementation(() => undefined);
    TestBed.inject(TranslocoService).setTranslation(
      { portfolio: { languages: { items: { german: { name: 5 } } } } },
      'en',
      { merge: true },
    );

    const broken = TestBed.createComponent(Languages);
    broken.detectChanges();

    expect(
      (broken.nativeElement as HTMLElement).querySelectorAll('[data-testid="language-card"]'),
    ).toHaveLength(0);
    expect(warn).toHaveBeenCalledOnce();
  });
});
