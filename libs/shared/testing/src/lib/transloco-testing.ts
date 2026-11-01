import { EnvironmentProviders } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { AVAILABLE_LANGS, DEFAULT_LANG } from '@rapaglaz/shared/util';
import { TranslocoFsLoader } from '@rapaglaz/shared/util/translations';

export function provideTranslocoTesting(): EnvironmentProviders[] {
  return provideTransloco({
    config: {
      availableLangs: [...AVAILABLE_LANGS],
      defaultLang: DEFAULT_LANG,
      reRenderOnLangChange: true,
      prodMode: false,
      missingHandler: {
        logMissingKey: true,
        useFallbackTranslation: false,
      },
    },
    loader: TranslocoFsLoader,
  });
}
