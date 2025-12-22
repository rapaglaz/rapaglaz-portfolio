import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer, Navbar } from './features';

@Component({
  selector: 'app-root',
  imports: [Navbar, RouterOutlet, Footer],
  template: `
    <app-navbar />
    <div class="min-h-screen">
      <router-outlet />
    </div>
    <app-footer />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
