import { TranslocoGlobalConfig } from '@jsverse/transloco-utils';

const config: TranslocoGlobalConfig = {
  rootTranslationsPath: 'public/i18n/',
  langs: ['en', 'de'],
  keysManager: {
    input: ['src'],
    emitErrorOnExtraKeys: false,
  },
};

export default config;
