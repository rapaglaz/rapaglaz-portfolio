import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { provideTranslocoTesting } from '@rapaglaz/shared/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { Certifications, type Certification } from './certifications';

const ITEMS: readonly Certification[] = [
  { id: 'angular-architecture', date: '2022-12', durationDays: 3, remote: true },
  { id: 'angular-spa-typescript', date: '2019-06', durationDays: 2, remote: false },
];

describe('Certifications', () => {
  let fixture: ComponentFixture<Certifications>;

  const cards = (): HTMLElement[] =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        '[data-testid="certification-card"]',
      ),
    );

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [Certifications],
      providers: [provideTranslocoTesting()],
    });
    await firstValueFrom(TestBed.inject(TranslocoService).load('en'));
    fixture = TestBed.createComponent(Certifications);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
  });

  it('renders one card per certification with its date, duration and format', () => {
    const [remote, onsite] = cards();

    expect(cards()).toHaveLength(2);
    expect(remote.querySelector('time')?.getAttribute('datetime')).toBe('2022-12');
    expect(remote.querySelector('time')?.textContent).toBe('December 2022');
    expect(remote.textContent).toContain('3 days');
    expect(remote.textContent).toContain('(remote)');
    expect(onsite.textContent).toContain('(onsite)');
  });

  it('formats the dates in the active language', async () => {
    const transloco = TestBed.inject(TranslocoService);
    await firstValueFrom(transloco.load('de'));
    transloco.setActiveLang('de');
    fixture.detectChanges();

    expect(cards()[0].querySelector('time')?.textContent).toBe('Dezember 2022');
    expect(cards()[1].textContent).toContain('(vor Ort)');
  });

  it('shows the raw value when a date cannot be parsed', () => {
    fixture.componentRef.setInput('items', [{ ...ITEMS[0], date: '2022-13' }]);
    fixture.detectChanges();

    expect(cards()[0].querySelector('time')?.textContent).toBe('2022-13');
  });
});
