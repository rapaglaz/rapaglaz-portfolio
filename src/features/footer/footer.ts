import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { CONTACT_ITEMS } from '../../content/contact.content';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  imports: [TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  protected readonly currentYear = computed(() => new Date().getFullYear());

  protected contactEmail(): void {
    const emailItem = CONTACT_ITEMS.find(item => item.id === 'email');

    if (!emailItem?.href) return;
    window.location.assign(emailItem.href);
  }
}
