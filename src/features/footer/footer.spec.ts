import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTransloco } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TranslocoTestLoader } from '../../testing';
import { Footer } from './footer';

describe('Footer', () => {
  let fixture: ComponentFixture<Footer>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [
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

  it('renders footer with contact controls', () => {
    const footer = element.querySelector('footer');
    const emailButton = footer?.querySelector('button[aria-label="Email"]');

    expect(footer).toBeTruthy();
    expect(emailButton).toBeTruthy();
  });

  it('delegates contactEmail to window.location', () => {
    const assignSpy = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { assign: assignSpy },
      writable: true,
      configurable: true,
    });

    fixture.componentInstance['contactEmail']();

    expect(assignSpy).toHaveBeenCalledTimes(1);
    expect(assignSpy.mock.calls[0][0]).toMatch(/^mailto:/);

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });
});
