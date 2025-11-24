import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { SectionWrapper } from './section-wrapper';

describe('SectionWrapper', () => {
  let fixture: ComponentFixture<SectionWrapper>;
  let element: HTMLElement;

  function setup(sectionId: string, titleKey: string): void {
    fixture.componentRef.setInput('sectionId', sectionId);
    fixture.componentRef.setInput('titleKey', titleKey);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionWrapper],
      providers: [provideZonelessChangeDetection(), provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionWrapper);
    element = fixture.nativeElement;
  });

  it('renders section with sectionId', () => {
    setup('about', 'portfolio.about.title');

    const section = element.querySelector('section');
    expect(section?.id).toBe('about');
  });

  it('auto-generates testId from sectionId', () => {
    setup('skills', 'portfolio.skills.title');

    const section = element.querySelector('section');
    expect(section?.getAttribute('data-testid')).toBe('section-skills');
  });

  it('translates and uppercases title', async () => {
    setup('skills', 'portfolio.skills.title');

    await vi.waitFor(() => {
      const title = element.querySelector('h2');
      expect(title?.textContent?.trim()).toBe('SKILLS');
    });
  });

  it('triggers scroll reveal animation', async () => {
    setup('about', 'portfolio.about.title');
    const component = fixture.componentInstance;

    // Trigger visibility
    component.scrollReveal.onVisibilityChange(true);

    await vi.waitFor(() => {
      expect(component.scrollReveal.isVisible()).toBe(true);
    });

    component.scrollReveal.onVisibilityChange(false);
    expect(component.scrollReveal.isVisible()).toBe(true);
  });

  it('renders content slot in right column', () => {
    setup('about', 'portfolio.about.title');

    const rightColumn = element.querySelector('.grid > div:last-child');
    expect(rightColumn).toBeTruthy();
  });
});
