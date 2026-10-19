import { DOCUMENT } from '@angular/common';
import { afterNextRender, DestroyRef, Directive, ElementRef, inject } from '@angular/core';

const RESIZE_DEBOUNCE_MS = 100;

@Directive({
  selector: '[appMeasureNavbarHeight]',
})
export class MeasureNavbarHeightDirective {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const element = this.elementRef.nativeElement;
      const rootStyle = this.document.documentElement.style;
      const updateHeight = (): void => {
        const height = element.getBoundingClientRect().height;
        rootStyle.setProperty('--navbar-height', `${height}px`);
      };

      updateHeight();

      if (typeof ResizeObserver === 'undefined') {
        return;
      }

      let debounceTimer: ReturnType<typeof setTimeout> | undefined;
      const resizeObserver = new ResizeObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(updateHeight, RESIZE_DEBOUNCE_MS);
      });

      resizeObserver.observe(element);
      this.destroyRef.onDestroy(() => {
        clearTimeout(debounceTimer);
        resizeObserver.disconnect();
      });
    });
  }
}
