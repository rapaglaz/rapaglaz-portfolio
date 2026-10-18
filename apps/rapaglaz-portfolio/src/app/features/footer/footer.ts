import { Component } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { CONTACT_LINKS } from '../../content';
import { injectContactEmailOpener } from '../../utils/contact';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  imports: [TranslocoModule],
})
export class Footer {
  protected readonly links = CONTACT_LINKS;
  protected readonly currentYear = new Date().getFullYear();
  protected readonly contactEmail = injectContactEmailOpener();
}
