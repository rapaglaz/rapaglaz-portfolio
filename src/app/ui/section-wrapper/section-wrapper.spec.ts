import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
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
      providers: [provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionWrapper);
    element = fixture.nativeElement;
  });

  it('renders section shell with provided id and title', () => {
    setup('about', 'portfolio.about.title');

    const section = element.querySelector('section');
    const heading = element.querySelector('h2');

    expect(section?.id).toBe('about');
    expect(section?.getAttribute('aria-labelledby')).toBe(heading?.id);
    expect(heading?.id).toBe('about-heading');
    expect(heading?.textContent?.trim()).toBe('About Me');
    expect(heading?.classList.contains('uppercase')).toBe(true);
  });
});
