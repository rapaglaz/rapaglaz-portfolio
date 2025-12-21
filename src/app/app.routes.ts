import { Routes } from '@angular/router';
import { AVAILABLE_LANGS, DEFAULT_LANG } from './utils/i18n';

const portfolioRoute = () => import('./portfolio/portfolio').then(m => m.Portfolio);

export const routes: Routes = [
  {
    path: '',
    loadComponent: portfolioRoute,
  },
  ...AVAILABLE_LANGS.map(lang => ({
    path: lang,
    loadComponent: portfolioRoute,
  })),
  {
    path: '**',
    redirectTo: DEFAULT_LANG,
  },
];
