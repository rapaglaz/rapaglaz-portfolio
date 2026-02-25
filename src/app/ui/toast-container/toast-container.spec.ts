import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToastContainer } from './toast-container';

describe('ToastContainer', () => {
  let fixture: ComponentFixture<ToastContainer>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainer],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainer);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('displays the message from data', () => {
    fixture.componentRef.setInput('data', { message: 'Download complete!', type: 'success' });
    fixture.detectChanges();

    const message = element.querySelector('p');
    expect(message?.textContent).toBe('Download complete!');
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

    let container = element.querySelector('[role="alert"]');
    expect(container?.getAttribute('aria-live')).toBe('polite');

    fixture.componentRef.setInput('data', { message: 'Info', type: 'info' });
    fixture.detectChanges();

    container = element.querySelector('[role="alert"]');
    expect(container?.getAttribute('aria-live')).toBe('polite');
  });
});
