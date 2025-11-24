import { Directive, ElementRef, effect, inject, output } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
})
export class ScrollRevealDirective {
  private readonly elementRef = inject(ElementRef);

  readonly visibilityChange = output<boolean>();

  constructor() {
    effect(onCleanup => {
      if (typeof IntersectionObserver === 'undefined') {
        this.visibilityChange.emit(true);
        return;
      }

      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            this.visibilityChange.emit(entry.isIntersecting);
          });
        },
        {
          root: null,
          threshold: 0.25,
        },
      );

      observer.observe(this.elementRef.nativeElement);

      onCleanup(() => observer.disconnect());
    });
  }
}
