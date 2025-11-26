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

  it('renders translated language names and levels', () => {
    const cards = element.querySelectorAll('div.card-ocean');

    expect(cards.length).toBeGreaterThan(0);
    const firstCardText = cards[0]?.textContent ?? '';

    expect(firstCardText).toMatch(/German|Deutsch/i);
    expect(firstCardText).toMatch(/Professional/i);
  });
});
