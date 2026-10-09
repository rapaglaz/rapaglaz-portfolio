import { Component, PLATFORM_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrollRevealDirective } from './scroll-reveal.directive';

@Component({
  selector: 'app-test-host',
  template: `
    <div
      appScrollReveal
      (visibilityChange)="onVisibilityChange($event)">
      <div class="animate-container">
        <a
          class="animate-item"
          href="#content"
          >Test Content</a
        >
      </div>
    </div>
  `,
  imports: [ScrollRevealDirective],
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

  it('disconnects observer after first intersection', () => {
    const entry = { isIntersecting: true } as IntersectionObserverEntry;
    observerCallback([entry]);
    expect(disconnectSpy).toHaveBeenCalledOnce();
  });

  it('does not emit when element is not intersecting', () => {
    const emitSpy = vi.spyOn(component, 'onVisibilityChange');
    observerCallback([{ isIntersecting: false } as IntersectionObserverEntry]);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('disconnects observer on destroy', () => {
    fixture.destroy();
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('reveals a focused link and its ancestors before an intersection occurs', async () => {
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    link.focus();
    await fixture.whenStable();

    expect(component.isVisible()).toBe(true);
    expect(link.classList.contains('reveal-on-focus')).toBe(true);
    expect(link.parentElement?.classList.contains('reveal-on-focus')).toBe(true);
    expect(disconnectSpy).toHaveBeenCalledOnce();

    link.blur();
    expect(link.classList.contains('reveal-on-focus')).toBe(true);
  });

  it('reveals content when IntersectionObserver is unavailable', async () => {
    delete (globalThis as any).IntersectionObserver;
    const fallback = TestBed.createComponent(TestHostComponent);
    await fallback.whenStable();

    expect(fallback.componentInstance.isVisible()).toBe(true);
    const link = fallback.nativeElement.querySelector('a') as HTMLAnchorElement;
    link.focus();
    await fallback.whenStable();
    expect(link.classList.contains('reveal-on-focus')).toBe(true);
  });

  it('reveals content on the server without observing browser elements', async () => {
    fixture.destroy();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    observeSpy.mockClear();
    const serverFixture = TestBed.createComponent(TestHostComponent);
    await serverFixture.whenStable();

    expect(serverFixture.componentInstance.isVisible()).toBe(true);
    expect(observeSpy).not.toHaveBeenCalled();
    const link = serverFixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    link.focus();
    await serverFixture.whenStable();
    expect(link.classList.contains('reveal-on-focus')).toBe(false);
  });
});
