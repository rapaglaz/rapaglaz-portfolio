import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { TRANSLOCO_LOADER } from '@jsverse/transloco';
import { appConfig } from './app.config';
import { TranslocoFsLoader } from './utils/i18n';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(), { provide: TRANSLOCO_LOADER, useClass: TranslocoFsLoader }],
};

export const appConfigServer = mergeApplicationConfig(appConfig, serverConfig);
