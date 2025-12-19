import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { Languages } from './languages';

describe('Languages', () => {
  let fixture: ComponentFixture<Languages>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Languages],
      providers: [provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Languages);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders language cards with labels', () => {
    const cards = element.querySelectorAll('[data-testid="language-card"]');

    expect(cards.length).toBeGreaterThan(0);

    cards.forEach(card => {
      const name = card.querySelector('h3');
      const level = card.querySelector('p');

      expect(name?.textContent?.trim()).toBeTruthy();
      expect(level?.textContent?.trim()).toBeTruthy();
    });
  });
});
