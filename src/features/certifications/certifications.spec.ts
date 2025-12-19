import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CERTIFICATIONS } from '../../content';
import { provideTranslocoTesting } from '../../testing';
import { Certifications } from './certifications';

describe('Certifications', () => {
  let fixture: ComponentFixture<Certifications>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Certifications],
      providers: [provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Certifications);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders certification cards with visible details', () => {
    const section = element.querySelector('section#certifications');
    expect(section).toBeInstanceOf(HTMLElement);

    const cards = element.querySelectorAll('[data-testid="certification-card"]');
    expect(cards.length).toBe(CERTIFICATIONS.length);

    const firstCard = cards[0] as HTMLElement | undefined;
    const firstCert = CERTIFICATIONS[0];

    expect(firstCard).toBeInstanceOf(HTMLElement);
    const title = firstCard?.querySelector('h3');
    const issuer = firstCard?.querySelector('p');
    const time = firstCard?.querySelector('time');

    expect(title?.textContent?.trim()).toBeTruthy();
    expect(issuer?.textContent?.trim()).toBeTruthy();
    expect(time?.getAttribute('datetime')).toBe(firstCert?.date);
    expect(firstCard?.textContent).toContain(firstCert?.date.split('-')[0]);
    expect(firstCard?.textContent).toContain('days');
  });
});
