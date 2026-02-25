import { Routes } from '@angular/router';
import { AVAILABLE_LANGS } from './utils/i18n';

const loadPortfolio = () => import('./portfolio/portfolio').then(m => m.Portfolio);

export const routes: Routes = [
  {
    path: '',
    loadComponent: loadPortfolio,
  },
  ...AVAILABLE_LANGS.map(lang => ({
    path: lang,
    loadComponent: loadPortfolio,
  })),
  {
    path: '**',
    redirectTo: '',
  },
];
