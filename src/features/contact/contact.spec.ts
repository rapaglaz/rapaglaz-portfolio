import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CONTACT_ITEMS } from '../../content';
import { provideTranslocoTesting } from '../../testing';
import { Contact } from './contact';

describe('Contact', () => {
  let fixture: ComponentFixture<Contact>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contact],
      providers: [provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Contact);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders contact links with proper external attributes', () => {
    const links = element.querySelectorAll('a.card-ocean');
    const expectedCount = CONTACT_ITEMS.length;

    expect(links.length).toBe(expectedCount);

    links.forEach((link, index) => {
      const item = CONTACT_ITEMS[index];
      const target = link.getAttribute('target');
      const rel = link.getAttribute('rel');

      if (item.isExternal) {
        expect(target).toBe('_blank');
        expect(rel).toBe('noopener noreferrer');
      } else {
        expect(target).toBeNull();
        expect(rel).toBeNull();
      }
    });
  });
});
