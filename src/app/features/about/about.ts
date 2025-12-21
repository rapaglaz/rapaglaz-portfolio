import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { SectionWrapper } from '../../ui';

@Component({
  selector: 'app-about',
  imports: [TranslocoModule, SectionWrapper],
  templateUrl: './about.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  protected readonly sectionWrapper = viewChild.required(SectionWrapper);
}
