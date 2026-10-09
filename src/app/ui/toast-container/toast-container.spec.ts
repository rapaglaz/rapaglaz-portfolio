import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { ToastContainer } from './toast-container';

describe('ToastContainer', () => {
  let fixture: ComponentFixture<ToastContainer>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainer],
      providers: [provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainer);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('displays the message from data', () => {
    fixture.componentRef.setInput('data', { message: 'Download complete!', type: 'success' });
    fixture.detectChanges();

    const message = element.querySelector('p');
    expect(message?.textContent?.trim()).toBe('Download complete!');
  });

  it('uses assertive aria-live for errors', () => {
    fixture.componentRef.setInput('data', { message: 'Failed to download', type: 'error' });
    fixture.detectChanges();

    const container = element.querySelector('[role="alert"]');
    expect(container?.getAttribute('aria-live')).toBe('assertive');
  });

  it('uses polite aria-live for success and info', () => {
    fixture.componentRef.setInput('data', { message: 'Success!', type: 'success' });
    fixture.detectChanges();

    let container = element.querySelector('[role="status"]');
    expect(container?.getAttribute('aria-live')).toBe('polite');

    fixture.componentRef.setInput('data', { message: 'Info', type: 'info' });
    fixture.detectChanges();

    container = element.querySelector('[role="status"]');
    expect(container?.getAttribute('aria-live')).toBe('polite');
  });

  it('keeps the translated close action outside the live message', () => {
    const close = element.querySelector<HTMLButtonElement>('button');
    expect(close?.getAttribute('aria-label')).toBe('Close notification');
    expect(close?.closest('[aria-live]')).toBeNull();
  });

  it('updates the close action when the active locale changes', () => {
    TestBed.inject(TranslocoService).setActiveLang('de');
    fixture.detectChanges();
    expect(element.querySelector('button')?.getAttribute('aria-label')).toBe(
      'Benachrichtigung schließen',
    );
  });

  it('emits a dismissal when the close button is clicked', () => {
    const dismissed = vi.fn();
    fixture.componentInstance.dismissed.subscribe(dismissed);

    element.querySelector<HTMLButtonElement>('button')!.click();

    expect(dismissed).toHaveBeenCalledOnce();
  });
});
