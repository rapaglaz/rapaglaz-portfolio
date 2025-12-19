import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  About,
  Certifications,
  Contact,
  Footer,
  Hero,
  Languages,
  Navbar,
  Skills,
} from '../features';

@Component({
  selector: 'app-portfolio',
  imports: [TranslocoPipe, Navbar, Hero, About, Skills, Languages, Certifications, Contact, Footer],
  templateUrl: './portfolio.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Portfolio {}
