import { Routes } from '@angular/router';
import { AVAILABLE_LANGS, DEFAULT_LANG } from './utils/i18n';

export const routes: Routes = [
  {
    path: '',
    redirectTo: DEFAULT_LANG,
    pathMatch: 'full',
  },
  ...AVAILABLE_LANGS.map(lang => ({
    path: lang,
    loadComponent: () => import('./portfolio/portfolio').then(m => m.Portfolio),
  })),
  {
    path: '**',
    redirectTo: DEFAULT_LANG,
  },
];
