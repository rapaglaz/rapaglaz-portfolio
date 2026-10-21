import { Component, computed, inject, input, viewChild } from '@angular/core';
import { translateObjectSignal, translateSignal, TranslocoModule } from '@jsverse/transloco';
import type { ContactItem } from '@rapaglaz/portfolio/util';
import { SectionWrapper } from '@rapaglaz/shared/ui';
import { buildStaggerDelay, LoggerService } from '@rapaglaz/shared/util';
import * as v from 'valibot';

const LabelsSchema = v.record(v.string(), v.string());

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
  private readonly logger = inject(LoggerService);
  private readonly rawContactLabels = translateObjectSignal('portfolio.contact.labels');
  protected readonly contactLabels = computed(() => {
    const result = v.safeParse(LabelsSchema, this.rawContactLabels());
    if (!result.success) {
      this.logger.warn('The contact labels do not have the expected shape.');
      return {};
    }
    return result.output;
  });
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
