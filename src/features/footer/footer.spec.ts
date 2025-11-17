import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTransloco } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';
import { TranslocoTestLoader, mockWindowLocation } from '../../testing';
import { Footer } from './footer';

describe('Footer', () => {
  let fixture: ComponentFixture<Footer>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [
        provideZonelessChangeDetection(),
        provideTransloco({
          config: {
            availableLangs: ['en', 'de'],
            defaultLang: 'en',
          },
          loader: TranslocoTestLoader,
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  const find = (selector: string): Element | null => element.querySelector(selector);

  it('renders accessible email button', () => {
    const emailButton = find('button[aria-label="Email"]');

    expect(emailButton).toBeTruthy();
    expect(emailButton?.getAttribute('type')).toBe('button');
  });

  it('opens mail client on button click', () => {
    const { assignMock, cleanup } = mockWindowLocation();

    const emailButton = find('button[aria-label="Email"]') as HTMLButtonElement;
    emailButton.click();

    expect(assignMock).toHaveBeenCalledOnce();
    expect(assignMock.mock.calls[0][0]).toMatch(/^mailto:/);

    cleanup();
  });

  it('external links have security attributes', () => {
    const externalLinks = Array.from(element.querySelectorAll('a[target="_blank"]'));

    expect(externalLinks.length).toBeGreaterThan(0);
    externalLinks.forEach(link => {
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });
});
