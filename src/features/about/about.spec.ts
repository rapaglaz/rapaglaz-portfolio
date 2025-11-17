import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { About } from './about';

describe('About', () => {
  it('integrates with section wrapper', async () => {
    await TestBed.configureTestingModule({
      imports: [About],
      providers: [provideZonelessChangeDetection(), provideTranslocoTesting()],
    }).compileComponents();

    const fixture = TestBed.createComponent(About);
    fixture.detectChanges();

    const section = fixture.nativeElement.querySelector('section#about');
    expect(section).toBeTruthy();
  });
});
