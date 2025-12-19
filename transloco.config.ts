import { TranslocoGlobalConfig } from '@jsverse/transloco-utils';
import { AVAILABLE_LANGS } from './src/utils/i18n/languages';

const config: TranslocoGlobalConfig = {
  rootTranslationsPath: 'public/i18n/',
  langs: [...AVAILABLE_LANGS],
  keysManager: {
    input: ['src'],
    emitErrorOnExtraKeys: false,
  },
};

export default config;
