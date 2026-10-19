import { TestBed } from '@angular/core/testing';
import { provideTranslocoTesting } from '@rapaglaz/shared/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Skills, type SkillCategory } from './skills';

// The page passes the real content; a few ids from the dictionaries are enough here
const CATEGORIES: readonly SkillCategory[] = [
  { id: 'frontend', skills: [{ id: 'angular' }, { id: 'typescript' }] },
  { id: 'testing', skills: [{ id: 'rxjs' }] },
  { id: 'familiar', skills: [{ id: 'react' }, { id: 'vue' }] },
];

describe('Skills', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Skills], providers: [provideTranslocoTesting()] });
  });

  it('renders skill labels in order with staggered animation delays', () => {
    const fixture = TestBed.createComponent(Skills);
    fixture.componentRef.setInput('categories', CATEGORIES);
    fixture.detectChanges();
    const badges = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
      '[data-testid="skill-badge"]',
    );

    expect(badges).toHaveLength(3);
    expect(Array.from(badges, badge => badge.textContent?.trim()).slice(0, 3)).toEqual([
      'Angular',
      'TypeScript',
      'RxJS',
    ]);
    expect(badges[0].style.animationDelay).toBe('0.15s');
    expect(badges[1].style.animationDelay).toBe('0.16s');
    expect(badges[2].style.animationDelay).toBe('0.18s');
    expect(badges[0].classList.contains('visible')).toBe(true);
  });

  it('renders familiar-with skills in a separate labelled group', () => {
    const fixture = TestBed.createComponent(Skills);
    fixture.componentRef.setInput('categories', CATEGORIES);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const secondary = host.querySelectorAll<HTMLElement>('[data-testid="skill-badge-secondary"]');

    expect(host.querySelector('[data-testid="skills-secondary-title"]')).not.toBeNull();
    expect(Array.from(secondary, badge => badge.textContent?.trim())).toEqual(['React', 'Vue']);
    expect(secondary[0].style.animationDelay).toBe('0.2s');
  });
});
