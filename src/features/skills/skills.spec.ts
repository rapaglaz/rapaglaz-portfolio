import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { Skills } from './skills';

describe('Skills', () => {
  it('renders skill categories', async () => {
    await TestBed.configureTestingModule({
      imports: [Skills],
      providers: [provideZonelessChangeDetection(), provideTranslocoTesting()],
    }).compileComponents();

    const fixture = TestBed.createComponent(Skills);
    fixture.detectChanges();

    const section = fixture.nativeElement.querySelector('section#skills');
    expect(section).toBeTruthy();
  });
});
