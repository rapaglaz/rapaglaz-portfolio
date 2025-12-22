import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { TRANSLOCO_LOADER } from '@jsverse/transloco';
import { appConfigBase } from './app.config';
import { routes } from './app.routes';
import { TranslocoFsLoader } from './utils/i18n';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
    { provide: TRANSLOCO_LOADER, useClass: TranslocoFsLoader },
  ],
};

export const appConfigServer = mergeApplicationConfig(appConfigBase, serverConfig);
