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
