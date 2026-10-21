import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { TRANSLOCO_LOADER } from '@jsverse/transloco';
import { TranslocoFsLoader } from '@rapaglaz/shared/util/translations';
import { appConfigBase } from './app.config';
import { routes } from './app.routes';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideRouter(routes),
    { provide: TRANSLOCO_LOADER, useClass: TranslocoFsLoader },
  ],
};

export const appConfigServer = mergeApplicationConfig(appConfigBase, serverConfig);
