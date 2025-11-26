import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ButtonDirective, type ButtonSize, type ButtonVariant } from './button';

describe('ButtonDirective', () => {
  @Component({
    template: `
      <button
        type="button"
        appButton
        [variant]="variant()"
        [size]="size()"
        [circle]="circle()"
        [disabled]="disabled()"
        (click)="handleClick()">
        Test
      </button>
    `,
    imports: [ButtonDirective],
    changeDetection: ChangeDetectionStrategy.OnPush,
  })
  class TestComponent {
    readonly variant = signal<ButtonVariant>('primary');
    readonly size = signal<ButtonSize>('md');
    readonly circle = signal(false);
    readonly disabled = signal(false);
    readonly handleClick = vi.fn();

    readonly buttonDirective = viewChild.required<ButtonDirective>(ButtonDirective);
  }

  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emits click events when activated', () => {
    const button = fixture.nativeElement.querySelector('button');

    button.click();
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(enterEvent);

    if (!enterEvent.defaultPrevented) {
      button.click();
    }

    expect(component.handleClick).toHaveBeenCalledTimes(2);
  });

  it('prevents interaction when disabled', () => {
    component.disabled.set(true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);

    button.click();
    expect(component.handleClick).not.toHaveBeenCalled();
  });
});
