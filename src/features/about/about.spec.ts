import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { About } from './about';

describe('About', () => {
  let fixture: ComponentFixture<About>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [About],
      providers: [provideZonelessChangeDetection(), provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(About);
    element = fixture.nativeElement;

    const transloco = TestBed.inject(TranslocoService);
    await firstValueFrom(transloco.load('en'));

    fixture.detectChanges();
  });

  it('renders section with correct id for navigation', () => {
    const section = element.querySelector('section#about');
    expect(section).toBeTruthy();
  });

  it('displays translated description content', () => {
    const description = element.querySelector('.animate-content p');

    expect(description).toBeTruthy();
    expect(description?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('uses semantic paragraph element for description', () => {
    const paragraph = element.querySelector('.animate-content p');

    expect(paragraph).toBeTruthy();
    expect(paragraph?.classList.contains('text-lg')).toBe(true);
  });

  it('integrates with section wrapper component', () => {
    const sectionWrapper = element.querySelector('app-section-wrapper');
    expect(sectionWrapper).toBeTruthy();
  });
});
