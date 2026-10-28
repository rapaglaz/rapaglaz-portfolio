import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslocoTesting } from '@rapaglaz/shared/testing';
import { beforeEach, describe, expect, it } from 'vitest';
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
    expect(heading?.textContent?.trim()).toBe('About Me');
    expect(heading?.classList.contains('uppercase')).toBe(true);
  });

  it('separates the section with a divider on desktop only and keeps the title column sticky', () => {
    setup('about', 'portfolio.about.title');

    const grid = element.querySelector('section > div > div');
    const titleColumn = element.querySelector('h2')?.parentElement;

    expect(grid?.classList.contains('lg:border-t')).toBe(true);
    expect(grid?.classList.contains('border-t')).toBe(false);
    expect(grid?.classList.contains('rounded-lg')).toBe(false);
    expect(titleColumn?.classList.contains('sticky')).toBe(true);
    expect(titleColumn?.classList.contains('lg:top-[calc(var(--navbar-height,7rem)+1.5rem)]')).toBe(
      true,
    );
  });
});
