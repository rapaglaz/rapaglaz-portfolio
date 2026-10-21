// Separate entry point: the loader bundles both dictionaries, and from the main barrel they ended
// up in the browser main chunk (+5 kB). Only the server config and the test setup use it.
export { TranslocoFsLoader } from './lib/i18n/transloco-fs-loader/transloco-fs-loader';
