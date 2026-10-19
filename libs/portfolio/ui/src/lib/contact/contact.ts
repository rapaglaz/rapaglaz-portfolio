import { Component, input, viewChild } from '@angular/core';
import { translateObjectSignal, translateSignal, TranslocoModule } from '@jsverse/transloco';
import { SectionWrapper } from '@rapaglaz/shared/ui';
import { buildDelayGetter, type ContactItem } from '@rapaglaz/shared/util';

@Component({
  selector: 'app-contact',
  imports: [TranslocoModule, SectionWrapper],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {
  readonly items = input.required<readonly ContactItem[]>();

  protected readonly sectionWrapper = viewChild.required(SectionWrapper);
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
