import { common as de } from './i18n/de.json';
import { common as en } from './i18n/en.json';
import type { AvailableLang } from './lib/i18n/languages';

// Separate entry point: a failed bootstrap has no Transloco, so the message comes from the
// bundled dictionaries. Only `common` ends up in the browser main chunk, not the whole dictionary.
/** t(common.bootstrapError) */
export const BOOTSTRAP_ERRORS: Readonly<Record<AvailableLang, string>> = {
  en: en.bootstrapError,
  de: de.bootstrapError,
};
