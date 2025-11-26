import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SKILL_CATEGORIES } from '../../content';
import { provideTranslocoTesting } from '../../testing';
import { Skills } from './skills';

describe('Skills', () => {
  let fixture: ComponentFixture<Skills>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Skills],
      providers: [provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Skills);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders all skills from content with staggered delays', () => {
    const skillBadges = element.querySelectorAll('span.animate-pill');
    const expectedCount = SKILL_CATEGORIES.flatMap(category => category.skills).length;

    expect(skillBadges.length).toBe(expectedCount);
    // verify staggered delay is applied incrementally
    const firstDelay = (skillBadges[0] as HTMLElement).style.animationDelay;
    const secondDelay = (skillBadges[1] as HTMLElement).style.animationDelay;
    expect(firstDelay).not.toBe('');
    expect(secondDelay).not.toBe('');
    expect(secondDelay).not.toBe(firstDelay);
  });
});
