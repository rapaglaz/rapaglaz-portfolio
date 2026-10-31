import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslocoTesting } from '@rapaglaz/shared/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Hero } from './hero';

describe('Hero', () => {
  let fixture: ComponentFixture<Hero>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Hero], providers: [provideTranslocoTesting()] });
    fixture = TestBed.createComponent(Hero);
    fixture.detectChanges();
  });

  it('renders the name in two parts and sets the first name in a lighter weight', () => {
    const element = fixture.nativeElement as HTMLElement;
    const firstName = element.querySelector('[data-testid="hero-firstname"]');
    const lastName = element.querySelector('[data-testid="hero-lastname"]');

    expect(firstName?.textContent?.trim()).toBe('Radek');
    expect(lastName?.textContent?.trim()).toBe('Glaz');
    expect(firstName?.classList.contains('font-medium')).toBe(true);
    expect(lastName?.classList.contains('font-medium')).toBe(false);
  });

  it('renders the scroll cue as decoration only', () => {
    const element = fixture.nativeElement as HTMLElement;
    const cue = element.querySelector('[data-testid="hero-scroll-cue"]');

    expect(cue?.getAttribute('aria-hidden')).toBe('true');
    expect(cue?.querySelector('a, button')).toBeNull();
  });

  it('renders the availability badge only while openToWork is set', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="hero-badge-mobile"]')).toBeNull();

    fixture.componentRef.setInput('openToWork', true);
    fixture.detectChanges();

    expect(element.querySelector('[data-testid="hero-badge-mobile"]')?.textContent?.trim()).toBe(
      'Open to Work',
    );
    expect(element.querySelector('img')?.getAttribute('alt')).toBe('Radek Glaz');

    fixture.componentRef.setInput('openToWork', false);
    fixture.detectChanges();
    expect(element.querySelector('[data-testid="hero-badge-mobile"]')).toBeNull();
  });
});
