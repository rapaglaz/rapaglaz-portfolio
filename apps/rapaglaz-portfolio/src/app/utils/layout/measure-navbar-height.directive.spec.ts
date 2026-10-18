import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MeasureNavbarHeightDirective } from './measure-navbar-height.directive';

@Component({
  selector: 'app-test-host',
  template: `<nav appMeasureNavbarHeight>Test Content</nav>`,
  imports: [MeasureNavbarHeightDirective],
})
class TestHostComponent {}

describe('MeasureNavbarHeightDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let navElement: HTMLElement;
  let resizeCallback: ResizeObserverCallback;
  let observeSpy: ReturnType<typeof vi.fn>;
  let disconnectSpy: ReturnType<typeof vi.fn>;
  let height: number;

  const navbarHeight = (): string =>
    document.documentElement.style.getPropertyValue('--navbar-height');

  beforeEach(async () => {
    observeSpy = vi.fn();
    disconnectSpy = vi.fn();
    height = 64;

    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }
      observe = observeSpy;
      disconnect = disconnectSpy;
      unobserve = vi.fn();
    };

    // The initial measurement runs with the first render, before the element
    // is reachable from the test, so the mock has to sit on the prototype.
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      () => ({ height }) as DOMRect,
    );

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    navElement = fixture.nativeElement.querySelector('nav') as HTMLElement;

    // afterNextRender callbacks run once the application becomes stable.
    await fixture.whenStable();
  });

  afterEach(() => {
    document.documentElement.style.removeProperty('--navbar-height');
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('sets the --navbar-height CSS variable after the initial render', () => {
    expect(navbarHeight()).toBe('64px');
  });

  it('observes the host element for size changes', () => {
    expect(observeSpy).toHaveBeenCalledWith(navElement);
  });

  it('updates the CSS variable after a debounced resize', () => {
    vi.useFakeTimers();
    height = 80;

    resizeCallback([], {} as ResizeObserver);
    vi.advanceTimersByTime(50);
    expect(navbarHeight()).toBe('64px');

    resizeCallback([], {} as ResizeObserver);
    vi.advanceTimersByTime(100);
    expect(navbarHeight()).toBe('80px');
  });

  it('disconnects the observer and clears the pending timer on destroy', () => {
    vi.useFakeTimers();
    height = 80;

    resizeCallback([], {} as ResizeObserver);
    fixture.destroy();
    vi.advanceTimersByTime(100);

    expect(disconnectSpy).toHaveBeenCalledOnce();
    expect(navbarHeight()).toBe('64px');
  });
});
