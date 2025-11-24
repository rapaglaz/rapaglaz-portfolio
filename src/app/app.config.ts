import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  ApplicationRef,
  EnvironmentProviders,
  inject,
  isDevMode,
  makeEnvironmentProviders,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import {
  provideTransloco,
  TRANSLOCO_CONFIG,
  TRANSLOCO_MISSING_HANDLER,
  translocoConfig,
  type TranslocoConfig,
} from '@jsverse/transloco';
import { proxyInterceptor, turnstileInterceptor } from '../interceptors';
import { LoggerService } from '../services';
import {
  getBrowserLanguage,
  StrictTranslocoMissingHandler,
  TranslocoHttpLoader,
} from '../utils/i18n';
import { App } from './app';
import { routes } from './app.routes';

const AVAILABLE_LANGS = ['en', 'de'];

function provideTranslocoWithDynamicLang(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideTransloco({
      config: {
        availableLangs: AVAILABLE_LANGS,
        defaultLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: { useFallbackTranslation: false, allowEmpty: false },
      },
      loader: TranslocoHttpLoader,
    }),
    {
      provide: TRANSLOCO_CONFIG,
      useFactory: (): TranslocoConfig => {
        const logger = inject(LoggerService);
        const browserLang = getBrowserLanguage(logger).split('-')[0];
        const defaultLang = AVAILABLE_LANGS.includes(browserLang) ? browserLang : 'en';

        return translocoConfig({
          availableLangs: AVAILABLE_LANGS,
          defaultLang,
          reRenderOnLangChange: true,
          prodMode: !isDevMode(),
          missingHandler: { useFallbackTranslation: false, allowEmpty: false },
        });
      },
    },
    { provide: TRANSLOCO_MISSING_HANDLER, useClass: StrictTranslocoMissingHandler },
  ]);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([proxyInterceptor, turnstileInterceptor])),
    provideTranslocoWithDynamicLang(),
  ],
};

export function bootstrap(): Promise<ApplicationRef> {
  return bootstrapApplication(App, appConfig).catch(err => {
    console.error('[ERROR] Bootstrap failed:', err);
    throw err;
  });
}
