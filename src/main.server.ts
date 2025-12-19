import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfigServer } from './app/app.config.server';

export default function bootstrap(
  context: BootstrapContext,
): Promise<import('@angular/core').ApplicationRef> {
  return bootstrapApplication(App, appConfigServer, context);
}
