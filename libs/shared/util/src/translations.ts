// Separate entry point: the loader bundles both dictionaries, and from the main barrel they ended
// up in the browser main chunk (+5 kB) although only app.config.server.ts uses it
export { TranslocoFsLoader } from './lib/i18n/transloco-fs-loader';
