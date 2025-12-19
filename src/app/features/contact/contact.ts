import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { CONTACT_ITEMS, type ContactItem } from '../../content';
import { SectionWrapper } from '../../ui';
import { buildDelayGetter } from '../../utils/animation';

@Component({
  selector: 'app-contact',
  imports: [TranslocoModule, SectionWrapper],
  templateUrl: './contact.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  protected readonly sectionWrapper = viewChild(SectionWrapper);
  protected readonly contactItems: readonly ContactItem[] = CONTACT_ITEMS;
  protected readonly getContactDelay = buildDelayGetter('contact');
}
