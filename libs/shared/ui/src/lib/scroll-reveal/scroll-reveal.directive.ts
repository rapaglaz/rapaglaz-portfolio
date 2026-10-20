import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  OnInit,
  output,
  PLATFORM_ID,
} from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  host: { '(focusin)': 'revealOnFocus()' },
})
export class ScrollRevealDirective implements OnInit {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private observer?: IntersectionObserver;

  readonly visibilityChange = output<boolean>();

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') {
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

    this.observer = observer;
    observer.observe(this.elementRef.nativeElement);

    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  protected revealOnFocus(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const host = this.elementRef.nativeElement;
    let element = host.ownerDocument.activeElement;
    while (element && host.contains(element)) {
      element.classList.add('reveal-on-focus');
      element = element.parentElement;
    }
    this.visibilityChange.emit(true);
    this.observer?.disconnect();
  }
}
