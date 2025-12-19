import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { Hero } from './hero';

describe('Hero', () => {
  let fixture: ComponentFixture<Hero>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hero],
      providers: [provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Hero);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders hero section with core elements', () => {
    const section = element.querySelector('[data-testid="section-hero"]');
    const avatar = element.querySelector('img');
    const firstName = element.querySelector('[data-testid="hero-firstname"]');
    const lastName = element.querySelector('[data-testid="hero-lastname"]');
    const description = element.querySelector('[data-testid="hero-description"]');

    expect(section).toBeInstanceOf(HTMLElement);
    expect(avatar).toBeInstanceOf(HTMLImageElement);
    expect(avatar?.getAttribute('alt')?.trim()).toBeTruthy();
    expect(firstName?.textContent?.trim()).toBeTruthy();
    expect(lastName?.textContent?.trim()).toBeTruthy();
    expect(description?.textContent?.trim()).toBeTruthy();
  });
});
