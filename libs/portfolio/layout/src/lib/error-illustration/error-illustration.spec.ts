import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ErrorIllustration, type ErrorKind } from './error-illustration';

function render(kind: ErrorKind): HTMLElement {
  const fixture = TestBed.createComponent(ErrorIllustration);
  fixture.componentRef.setInput('kind', kind);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ErrorIllustration', () => {
  it('is decoration, so assistive technology skips it', () => {
    const svg = render('notFound').querySelector('svg');

    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
  });

  it('shows a bot with two eyes and many question marks when the page does not exist', () => {
    const element = render('notFound');
    const marks = Array.from(element.querySelectorAll<SVGElement>('.mark'));
    const transforms = marks.map(mark => mark.parentElement?.getAttribute('transform'));
    const widths = marks.map(mark => mark.style.getPropertyValue('stroke-width'));

    expect(element.querySelector('[data-testid="error-illustration-not-found"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="error-illustration-failed"]')).toBeNull();
    expect(element.querySelectorAll('.eye')).toHaveLength(2);
    expect(marks.length).toBeGreaterThan(5);
    expect(new Set(transforms).size).toBe(marks.length);
    expect(new Set(widths).size).toBeGreaterThan(1);
  });

  it('shows a bot with a bent antenna when something went wrong', () => {
    const element = render('failed');

    expect(element.querySelector('[data-testid="error-illustration-failed"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="error-illustration-not-found"]')).toBeNull();
    expect(element.querySelectorAll('.eye')).toHaveLength(0);
    expect(element.querySelectorAll('.mark')).toHaveLength(0);
  });
});
