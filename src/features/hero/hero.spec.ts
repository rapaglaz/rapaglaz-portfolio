import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { Hero } from './hero';

describe('Hero', () => {
  it('displays hero section', async () => {
    await TestBed.configureTestingModule({
      imports: [Hero],
      providers: [provideZonelessChangeDetection(), provideTranslocoTesting()],
    }).compileComponents();

    const fixture = TestBed.createComponent(Hero);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('section#hero')).toBeTruthy();
  });
});
