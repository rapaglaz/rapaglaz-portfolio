import { ViewportRuler } from '@angular/cdk/scrolling';
import { DOCUMENT } from '@angular/common';
import { Directive, effect, ElementRef, inject, output } from '@angular/core';
import { fromEvent, merge, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Directive({
  selector: '[appScrollReveal]',
})
export class ScrollRevealDirective {
  private readonly elementRef = inject(ElementRef);
  private readonly viewportRuler = inject(ViewportRuler);
  private readonly document = inject(DOCUMENT);

  readonly visibilityChange = output<boolean>();

  // effect for auto-cleanup, ViewportRuler handles resize + orientation changes
  private readonly scrollEffect = effect(onCleanup => {
    const win = this.document.defaultView;
    if (!win) {
      return;
    }

    // merge scroll + viewport changes, startWith checks initial visibility
    const subscription: Subscription = merge(fromEvent(win, 'scroll'), this.viewportRuler.change())
      .pipe(
        startWith(null),
        map(() => this.isInViewport()),
      )
      .subscribe(isVisible => {
        this.visibilityChange.emit(isVisible);
      });

    onCleanup(() => subscription.unsubscribe());
  });

  private isInViewport(): boolean {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const win = this.document.defaultView;
    const viewportHeight = win ? win.innerHeight || this.document.documentElement.clientHeight : 0;

    return rect.top < viewportHeight && rect.bottom > 0;
  }
}
