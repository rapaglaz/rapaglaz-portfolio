import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  About,
  Certifications,
  Contact,
  Footer,
  Hero,
  Languages,
  Navbar,
  Skills,
} from '../../features';

@Component({
  selector: 'app-portfolio',
  imports: [Navbar, Hero, About, Skills, Languages, Certifications, Contact, Footer],
  templateUrl: './portfolio.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Portfolio {}
