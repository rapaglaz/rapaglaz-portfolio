import { ViewportRuler } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

function mockRect(top: number, bottom: number): DOMRect {
  return {
    top,
    bottom,
    left: 0,
    right: 100,
    width: 100,
    height: 100,
    x: 0,
    y: top,
    toJSON: () => ({}),
  };
}

describe('ScrollRevealDirective', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let viewportChange$: Subject<void>;
  let element: HTMLElement;

  beforeEach(async () => {
    viewportChange$ = new Subject<void>();

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ViewportRuler, useValue: { change: (): Subject<void> => viewportChange$ } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement.querySelector('div');
  });

  it('emits true when element is in viewport', async () => {
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(mockRect(100, 200));

    fixture.detectChanges();

    await vi.waitFor(() => expect(component.isVisible()).toBe(true));
  });

  it('emits false when element is above viewport', async () => {
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(mockRect(-200, -100));

    fixture.detectChanges();

    await vi.waitFor(() => expect(component.isVisible()).toBe(false));
  });

  it('emits false when element is below viewport', async () => {
    const belowViewport = window.innerHeight + 100;
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(
      mockRect(belowViewport, belowViewport + 100),
    );

    fixture.detectChanges();

    await vi.waitFor(() => expect(component.isVisible()).toBe(false));
  });

  it('emits true when element top is at viewport boundary', async () => {
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(
      mockRect(window.innerHeight - 1, window.innerHeight + 99),
    );

    fixture.detectChanges();

    await vi.waitFor(() => expect(component.isVisible()).toBe(true));
  });

  it('reacts to viewport ruler changes', async () => {
    const rectSpy = vi
      .spyOn(element, 'getBoundingClientRect')
      .mockReturnValue(mockRect(window.innerHeight + 100, window.innerHeight + 200));

    fixture.detectChanges();
    await vi.waitFor(() => expect(component.isVisible()).toBe(false));

    rectSpy.mockReturnValue(mockRect(100, 200));
    viewportChange$.next();

    await vi.waitFor(() => expect(component.isVisible()).toBe(true));
  });

  it('reacts to scroll events', async () => {
    const rectSpy = vi
      .spyOn(element, 'getBoundingClientRect')
      .mockReturnValue(mockRect(window.innerHeight + 100, window.innerHeight + 200));

    fixture.detectChanges();
    await vi.waitFor(() => expect(component.isVisible()).toBe(false));

    rectSpy.mockReturnValue(mockRect(100, 200));
    window.dispatchEvent(new Event('scroll'));

    await vi.waitFor(() => expect(component.isVisible()).toBe(true));
  });

  it('cleans up subscriptions on destroy', async () => {
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(mockRect(100, 200));

    fixture.detectChanges();
    await vi.waitFor(() => expect(component.isVisible()).toBe(true));

    component.isVisible.set(false);
    fixture.destroy();

    window.dispatchEvent(new Event('scroll'));
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(component.isVisible()).toBe(false);
  });
});
