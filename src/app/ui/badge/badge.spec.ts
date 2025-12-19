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
    const badge = compiled.querySelector('[role="button"]');

    expect(badge).toBeInstanceOf(HTMLElement);
    expect(badge?.getAttribute('tabindex')).toBe('0');
    expect(badge?.getAttribute('aria-label')).toBe('Badge');

    fixture.componentRef.setInput('ariaLabel', 'Open to Work');
    fixture.detectChanges();

    expect(badge?.getAttribute('aria-label')).toBe('Open to Work');
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
});
