import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { Certifications } from './certifications';

describe('Certifications', () => {
  let fixture: ComponentFixture<Certifications>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Certifications],
      providers: [provideZonelessChangeDetection(), provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Certifications);
    element = fixture.nativeElement;

    const transloco = TestBed.inject(TranslocoService);
    await firstValueFrom(transloco.load('en'));

    fixture.detectChanges();
  });

  it('displays Angular Architects certifications', async () => {
    await vi.waitFor(() => {
      expect(element.querySelectorAll('.animate-cert').length).toBe(3);
    });

    const cards = Array.from(element.querySelectorAll('.animate-cert'));
    const cardTexts = cards.map(card => card.textContent ?? '');

    expect(cardTexts.some(text => text.includes('Angular Architecture Workshop'))).toBe(true);
    expect(cardTexts.some(text => text.includes('Testing Workshop'))).toBe(true);
    expect(cardTexts.some(text => text.includes('Angular Architects'))).toBe(true);
  });
});
