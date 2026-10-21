import { RenderMode, type ServerRoute } from '@angular/ssr';

// outputMode static: every route the router knows is prerendered at build time
export const serverRoutes: ServerRoute[] = [{ path: '**', renderMode: RenderMode.Prerender }];
