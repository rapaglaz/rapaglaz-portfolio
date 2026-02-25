import { DestroyRef, Directive, ElementRef, inject, OnInit, output } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
})
export class ScrollRevealDirective implements OnInit {
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly visibilityChange = output<boolean>();

  ngOnInit(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.visibilityChange.emit(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.visibilityChange.emit(true);
            observer.disconnect();
          }
        });
      },
      {
        root: null,
        threshold: 0.25,
      },
    );

    observer.observe(this.elementRef.nativeElement);

    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
