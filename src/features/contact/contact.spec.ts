import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { Contact } from './contact';

describe('Contact', () => {
  let fixture: ComponentFixture<Contact>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contact],
      providers: [provideZonelessChangeDetection(), provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Contact);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders contact section with interactive links', () => {
    const section = element.querySelector('section#contact');
    expect(section).toBeTruthy();

    const links = Array.from(section!.querySelectorAll('a, button'));
    expect(links.length).toBeGreaterThan(0);

    const externalLinks = Array.from(section!.querySelectorAll('a[target="_blank"]'));
    externalLinks.forEach(link => {
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });
});
