import { provideZonelessChangeDetection } from '@angular/core';
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
      providers: [provideZonelessChangeDetection(), provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Languages);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('displays all language proficiencies', () => {
    const section = element.querySelector('section#languages');
    const cards = element.querySelectorAll('.animate-item');

    expect(section).toBeTruthy();
    expect(cards.length).toBe(3);

    const cardTexts = Array.from(cards).map(card => card.textContent ?? '');

    expect(cardTexts.some(text => text.includes('Polish'))).toBe(true);
    expect(cardTexts.some(text => text.includes('German'))).toBe(true);
    expect(cardTexts.some(text => text.includes('English'))).toBe(true);
  });
});
