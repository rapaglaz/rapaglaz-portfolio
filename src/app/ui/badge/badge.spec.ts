import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Badge } from './badge';

describe('Badge', () => {
  let component: Badge;
  let fixture: ComponentFixture<Badge>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Badge],
    }).compileComponents();

    fixture = TestBed.createComponent(Badge);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('has accessible button with aria-label', () => {
    expect(compiled.getAttribute('role')).toBe('button');
    expect(compiled.getAttribute('tabindex')).toBe('0');
    expect(compiled.getAttribute('aria-label')).toBe('Badge');

    fixture.componentRef.setInput('ariaLabel', 'Open to Work');
    fixture.detectChanges();

    expect(compiled.getAttribute('aria-label')).toBe('Open to Work');
  });

  it('emits clicked event on click', () => {
    const clickedSpy = vi.fn();
    component.clicked.subscribe(clickedSpy);

    compiled.click();

    expect(clickedSpy).toHaveBeenCalled();
  });

  it('emits clicked event on enter keydown', () => {
    const clickedSpy = vi.fn();
    component.clicked.subscribe(clickedSpy);

    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    compiled.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(clickedSpy).toHaveBeenCalledTimes(1);
    expect(clickedSpy.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
  });

  it('applies size classes for sm, lg, xl', () => {
    // default is md
    expect(compiled.className).toContain('px-3');
    expect(compiled.className).toContain('py-1');
    expect(compiled.className).toContain('text-sm');

    fixture.componentRef.setInput('badgeSize', 'sm');
    fixture.detectChanges();
    expect(compiled.className).toContain('px-2.5');
    expect(compiled.className).toContain('text-xs');

    fixture.componentRef.setInput('badgeSize', 'lg');
    fixture.detectChanges();
    expect(compiled.className).toContain('px-4');
    expect(compiled.className).toContain('py-2');
    expect(compiled.className).toContain('text-base');

    fixture.componentRef.setInput('badgeSize', 'xl');
    fixture.detectChanges();
    expect(compiled.className).toContain('px-5');
    expect(compiled.className).toContain('py-2.5');
    expect(compiled.className).toContain('text-lg');
  });
});
