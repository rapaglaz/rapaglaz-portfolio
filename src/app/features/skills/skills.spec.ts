import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { Skills } from './skills';

describe('Skills', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Skills], providers: [provideTranslocoTesting()] });
  });

  it('renders skill labels in order with staggered animation delays', () => {
    const fixture = TestBed.createComponent(Skills);
    fixture.detectChanges();
    const badges = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
      '[data-testid="skill-badge"]',
    );

    expect(badges).toHaveLength(23);
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
});
