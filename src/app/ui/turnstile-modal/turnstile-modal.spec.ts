import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { TurnstileModal } from './turnstile-modal';

describe('TurnstileModal', () => {
  let fixture: ComponentFixture<TurnstileModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnstileModal],
      providers: [provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(TurnstileModal);
    fixture.detectChanges();
  });

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
    const spinner = element.querySelector('[role="status"] .loading-spinner');
    expect(spinner).toBeInstanceOf(HTMLElement);
    expect(spinner?.getAttribute('aria-hidden')).toBe('true');

    fixture.componentInstance.setLoading(false);
    fixture.detectChanges();

    expect(element.querySelector('[role="status"]')).toBeNull();
    expect(element.querySelector('.loading-spinner')).toBeNull();
    expect(element.querySelector('#turnstile-widget-container')).toBeInstanceOf(HTMLElement);

    fixture.componentInstance.setLoading(true);
    fixture.detectChanges();
    expect(element.querySelector('[role="status"]')).toBeInstanceOf(HTMLElement);
  });

  it('exposes a translated cancel action without adding a nested dialog', () => {
    const cancel = vi.fn();
    fixture.componentInstance.cancelled.subscribe(cancel);
    const element = fixture.nativeElement as HTMLElement;
    const button = element.querySelector<HTMLButtonElement>('[data-turnstile-cancel]');
    expect(button?.textContent?.trim()).toBe('Cancel');
    expect(element.querySelector('[role="dialog"]')).toBeNull();
    button?.click();
    expect(cancel).toHaveBeenCalledOnce();
  });
});
