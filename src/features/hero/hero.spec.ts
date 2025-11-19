import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { Hero } from './hero';

describe('Hero', () => {
  let fixture: ComponentFixture<Hero>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hero],
      providers: [provideZonelessChangeDetection(), provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Hero);
    element = fixture.nativeElement;

    const transloco = TestBed.inject(TranslocoService);
    await firstValueFrom(transloco.load('en'));

    fixture.detectChanges();
  });

  it('renders hero section with data-testid', () => {
    const section = element.querySelector('section#hero');

    expect(section).toBeTruthy();
    expect(section?.getAttribute('data-testid')).toBe('section-hero');
  });

  it('displays avatar image with accessible alt text', () => {
    const avatar = element.querySelector('.avatar img');

    expect(avatar).toBeTruthy();
    expect(avatar?.getAttribute('alt')).toBeTruthy();
    expect(avatar?.getAttribute('alt')?.length).toBeGreaterThan(0);
  });

  it('renders first and last name prominently', () => {
    const nameElements = element.querySelectorAll('.hero-name-paul, .hero-name-glaz');

    expect(nameElements.length).toBe(2);
    nameElements.forEach(nameEl => {
      expect(nameEl.textContent?.trim().length).toBeGreaterThan(0);
    });
  });

  it('displays hero description paragraph', () => {
    const description = element.querySelector('.hero-about p');

    expect(description).toBeTruthy();
    expect(description?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('sets priority loading on avatar image', () => {
    const avatar = element.querySelector('.avatar img');

    expect(avatar?.hasAttribute('priority')).toBe(true);
  });
});
