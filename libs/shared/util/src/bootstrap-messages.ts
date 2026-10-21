import type { AvailableLang } from './lib/i18n/languages/languages';
import { common as de } from './lib/i18n/translations/de.json';
import { common as en } from './lib/i18n/translations/en.json';

// Separate entry point: a failed bootstrap has no Transloco, so the message comes from the
// bundled dictionaries. Only `common` ends up in the browser main chunk, not the whole dictionary.
/** t(common.bootstrapError) */
export const BOOTSTRAP_ERRORS: Readonly<Record<AvailableLang, string>> = {
  en: en.bootstrapError,
  de: de.bootstrapError,
};
