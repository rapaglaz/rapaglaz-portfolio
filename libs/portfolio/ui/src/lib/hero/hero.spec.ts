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

  it('renders the scroll cue as a labelled button and reports clicks', () => {
    const element = fixture.nativeElement as HTMLElement;
    const cue = element.querySelector<HTMLButtonElement>('[data-testid="hero-scroll-cue"]');
    let clicks = 0;
    fixture.componentInstance.scrollCueClick.subscribe(() => clicks++);

    cue?.click();

    expect(cue?.tagName).toBe('BUTTON');
    expect(cue?.getAttribute('aria-label')).toBe('Scroll to About Me');
    expect(cue?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(clicks).toBe(1);
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
