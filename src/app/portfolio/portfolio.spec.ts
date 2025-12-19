import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { Portfolio } from './portfolio';

describe('Portfolio', () => {
  let fixture: ComponentFixture<Portfolio>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Portfolio],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Portfolio);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders navbar', () => {
    const navbar = element.querySelector('app-navbar');
    expect(navbar).toBeInstanceOf(HTMLElement);
  });

  it('renders main portfolio sections', () => {
    const main = element.querySelector('main');
    expect(main).toBeInstanceOf(HTMLElement);

    const sectionIds = ['hero', 'about', 'certifications', 'skills', 'languages', 'contact'];
    sectionIds.forEach(id => {
      const section = main?.querySelector(`[data-testid="section-${id}"]`);
      expect(section).toBeInstanceOf(HTMLElement);
    });
  });

  it('renders footer', () => {
    const footer = element.querySelector('app-footer');
    expect(footer).toBeInstanceOf(HTMLElement);
  });
});
