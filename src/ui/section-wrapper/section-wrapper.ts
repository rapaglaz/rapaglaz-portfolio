import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { createScrollRevealState, ScrollRevealDirective } from '../../utils/scroll';

@Component({
  selector: 'app-section-wrapper',
  imports: [TranslocoModule, UpperCasePipe, ScrollRevealDirective],
  templateUrl: './section-wrapper.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionWrapper {
  readonly sectionId = input.required<string>();
  readonly titleKey = input.required<string>();
  readonly testId = input<string>();
  readonly scrollReveal = createScrollRevealState();

  protected get computedTestId(): string {
    return this.testId() ?? `section-${this.sectionId()}`;
  }
}
