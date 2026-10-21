import { Component, computed, input, viewChild } from '@angular/core';
import { translateObjectSignal, translateSignal, TranslocoModule } from '@jsverse/transloco';
import type { ContactItem } from '@rapaglaz/portfolio/util';
import { SectionWrapper } from '@rapaglaz/shared/ui';
import { buildStaggerDelay } from '@rapaglaz/shared/util';

@Component({
  selector: 'app-contact',
  imports: [TranslocoModule, SectionWrapper],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {
  readonly items = input.required<readonly ContactItem[]>();

  protected readonly sectionWrapper = viewChild.required(SectionWrapper);
  protected readonly getContactDelay = buildStaggerDelay({ base: 0.15, increment: 0.075 });
  protected readonly contactLabels = translateObjectSignal('portfolio.contact.labels');
  protected readonly opensInNewTabLabel = translateSignal('common.a11y.opensInNewTab');

  protected readonly links = computed(() => {
    const labels = this.contactLabels();
    const newTab = this.opensInNewTabLabel();
    return this.items().map(contact => {
      const label = `${labels[contact.id] ?? contact.id}: ${contact.value}`;
      return {
        ...contact,
        target: contact.isExternal ? '_blank' : null,
        rel: contact.isExternal ? 'noopener noreferrer' : null,
        ariaLabel: contact.isExternal && newTab ? `${label} (${newTab})` : label,
      };
    });
  });
}
