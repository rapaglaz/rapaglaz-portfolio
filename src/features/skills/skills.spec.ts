import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { SKILL_CATEGORIES } from '../../content';
import { provideTranslocoTesting } from '../../testing';
import { Skills } from './skills';

describe('Skills', () => {
  let fixture: ComponentFixture<Skills>;
  let element: HTMLElement;

  const expectedSkillCount = SKILL_CATEGORIES.reduce((sum, cat) => sum + cat.skills.length, 0);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Skills],
      providers: [provideZonelessChangeDetection(), provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Skills);
    element = fixture.nativeElement;

    const transloco = TestBed.inject(TranslocoService);
    await firstValueFrom(transloco.load('en'));

    fixture.detectChanges();
  });

  it('renders section with correct id for navigation', () => {
    const section = element.querySelector('section#skills');
    expect(section).toBeTruthy();
  });

  it('displays all skill pills from categories', () => {
    const skillPills = element.querySelectorAll('.animate-pill');

    expect(skillPills.length).toBe(expectedSkillCount);
  });

  it('renders skills with translated content', () => {
    const skillPills = element.querySelectorAll('.animate-pill');

    skillPills.forEach(pill => {
      expect(pill.textContent?.trim().length).toBeGreaterThan(0);
    });
  });

  it('applies staggered animation delays to skills', () => {
    const skillPills = element.querySelectorAll('.animate-pill');
    const delays = Array.from(skillPills).map(pill => pill.getAttribute('style') ?? '');

    const uniqueDelays = new Set(delays.filter(d => d.includes('animation-delay')));
    expect(uniqueDelays.size).toBeGreaterThan(1);
  });

  it('integrates with section wrapper component', () => {
    const sectionWrapper = element.querySelector('app-section-wrapper');
    expect(sectionWrapper).toBeTruthy();
  });
});
