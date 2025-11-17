import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { TurnstileModal } from './turnstile-modal';

describe('TurnstileModal', () => {
  let fixture: ComponentFixture<TurnstileModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnstileModal],
      providers: [provideZonelessChangeDetection(), provideTranslocoTesting()],
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
});
