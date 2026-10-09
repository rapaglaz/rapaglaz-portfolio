import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeatureFlagService } from '../../services';
import { provideTranslocoTesting } from '../../testing';
import { Hero } from './hero';

describe('Hero', () => {
  let fixture: ComponentFixture<Hero>;
  const openToWork = signal(false);

  beforeEach(() => {
    openToWork.set(false);
    TestBed.configureTestingModule({
      imports: [Hero],
      providers: [
        provideTranslocoTesting(),
        {
          provide: FeatureFlagService,
          useValue: { getFlagValue: vi.fn(() => openToWork.asReadonly()) },
        },
      ],
    });
    fixture = TestBed.createComponent(Hero);
    fixture.detectChanges();
  });

  it('keeps the decorative ocean contours outside accessible content', () => {
    const contours = (fixture.nativeElement as HTMLElement).querySelector('svg');
    expect(contours?.getAttribute('aria-hidden')).toBe('true');
    expect(contours?.getAttribute('focusable')).toBe('false');
    expect(contours?.querySelector('title')).toBeNull();
  });

  it('renders the availability badge only while the feature flag is enabled', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="hero-badge-mobile"]')).toBeNull();

    openToWork.set(true);
    fixture.detectChanges();

    expect(element.querySelector('[data-testid="hero-badge-mobile"]')?.textContent?.trim()).toBe(
      'Open to Work',
    );
    expect(element.querySelector('img')?.getAttribute('alt')).toBe('Radoslaw Glaz');

    openToWork.set(false);
    fixture.detectChanges();
    expect(element.querySelector('[data-testid="hero-badge-mobile"]')).toBeNull();
  });
});
