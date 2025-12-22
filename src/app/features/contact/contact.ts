import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { translateObjectSignal, translateSignal, TranslocoModule } from '@jsverse/transloco';
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
  protected readonly sectionWrapper = viewChild.required(SectionWrapper);
  protected readonly contactItems: readonly ContactItem[] = CONTACT_ITEMS;
  protected readonly getContactDelay = buildDelayGetter('contact');
  protected readonly contactLabels = translateObjectSignal('portfolio.contact.labels');
  protected readonly opensInNewTabLabel = translateSignal('common.a11y.opensInNewTab');

  protected getContactTarget(contact: ContactItem): string | null {
    return contact.isExternal ? '_blank' : null;
  }

  protected getContactRel(contact: ContactItem): string | null {
    return contact.isExternal ? 'noopener noreferrer' : null;
  }

  protected getContactAriaLabel(contact: ContactItem): string {
    const labels = this.contactLabels();
    const label = labels[contact.id] ?? contact.id;
    const baseLabel = `${label}: ${contact.value}`;
    if (!contact.isExternal) {
      return baseLabel;
    }
    const newTabLabel = this.opensInNewTabLabel();
    return newTabLabel ? `${baseLabel} (${newTabLabel})` : baseLabel;
  }
}
