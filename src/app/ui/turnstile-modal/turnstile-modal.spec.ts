import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { TurnstileModal } from './turnstile-modal';

describe('TurnstileModal', () => {
  let fixture: ComponentFixture<TurnstileModal>;
  let trigger: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnstileModal],
      providers: [provideTranslocoTesting()],
    }).compileComponents();

    trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    fixture = TestBed.createComponent(TurnstileModal);
    fixture.detectChanges();
  });

  afterEach(() => trigger.remove());

  it('emits widget container after view init', () => {
    const handleReady = vi.fn();
    const freshFixture = TestBed.createComponent(TurnstileModal);

    freshFixture.componentInstance.widgetReady.subscribe(handleReady);
    freshFixture.detectChanges();

    expect(handleReady).toHaveBeenCalledOnce();

    const container = handleReady.mock.calls[0][0];
    expect(container).toBeInstanceOf(HTMLElement);
    expect(container.id).toBe('turnstile-widget-container');
  });

  it('shows the loading status until the widget is ready', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="status"]')).toBeInstanceOf(HTMLElement);

    fixture.componentInstance.setLoading(false);
    fixture.detectChanges();

    expect(element.querySelector('[role="status"]')).toBeNull();
    expect(element.querySelector('#turnstile-widget-container')).toBeInstanceOf(HTMLElement);

    fixture.componentInstance.setLoading(true);
    fixture.detectChanges();
    expect(element.querySelector('[role="status"]')).toBeInstanceOf(HTMLElement);
  });

  it('focuses the dialog and restores focus to the triggering button', () => {
    const dialog = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');
    expect(document.activeElement).toBe(dialog);

    fixture.componentInstance.restoreFocus();

    expect(document.activeElement).toBe(trigger);
  });
});
