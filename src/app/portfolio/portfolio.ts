import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { About, Certifications, Contact, Hero, Languages, Skills } from '../features';

@Component({
  selector: 'app-portfolio',
  imports: [TranslocoPipe, Hero, About, Skills, Languages, Certifications, Contact],
  templateUrl: './portfolio.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Portfolio {}
