import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrollRevealDirective } from './scroll-reveal.directive';

@Component({
  selector: 'app-test-host',
  template: `
    <div
      appScrollReveal
      (visibilityChange)="onVisibilityChange($event)">
      Test Content
    </div>
  `,
  imports: [ScrollRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestHostComponent {
  readonly isVisible = signal(false);

  onVisibilityChange(visible: boolean): void {
    this.isVisible.set(visible);
  }
}

describe('ScrollRevealDirective', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let observerCallback: (entries: IntersectionObserverEntry[]) => void;
  let observeSpy: any;
  let disconnectSpy: any;

  beforeEach(async () => {
    observeSpy = vi.fn();
    disconnectSpy = vi.fn();

    // Mock IntersectionObserver
    (globalThis as any).IntersectionObserver = class {
      constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
        observerCallback = callback;
      }
      observe = observeSpy;
      disconnect = disconnectSpy;
      unobserve = vi.fn();
      takeRecords = vi.fn();
      root = null;
      rootMargin = '';
      thresholds = [];
    } as any;

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    delete (globalThis as any).IntersectionObserver;
  });

  it('initializes observer on init', () => {
    expect(observeSpy).toHaveBeenCalled();
  });

  it('emits true when element intersects', () => {
    const entry = { isIntersecting: true } as IntersectionObserverEntry;
    observerCallback([entry]);
    expect(component.isVisible()).toBe(true);
  });

  it('emits false when element does not intersect', () => {
    observerCallback([{ isIntersecting: true } as IntersectionObserverEntry]);
    expect(component.isVisible()).toBe(true);

    observerCallback([{ isIntersecting: false } as IntersectionObserverEntry]);
    expect(component.isVisible()).toBe(false);
  });

  it('disconnects observer on destroy', () => {
    fixture.destroy();
    expect(disconnectSpy).toHaveBeenCalled();
  });
});
