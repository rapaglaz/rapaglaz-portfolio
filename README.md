# Paul Glaz Portfolio

Personal portfolio site. Small app, mostly static sections.

Built with Angular 21, standalone components, signals, no Zone.js. Static build with hydration.

## What’s inside

- Angular 21 (standalone, signals, OnPush)
- Zoneless setup (no `zone.js` dependency)
- Static build (SSG via `outputMode: static`) + client hydration
- Transloco i18n (runtime switch, JSON in `public/i18n`)
- Locale routes: `/en` and `/de`, root uses the default language
- CV download flow: Turnstile -> Worker -> signed R2 URL
- Feature flag for “Open to Work” (Worker + KV)
- Unit tests with Vitest, E2E with Playwright + axe
- Tailwind CSS 4 + DaisyUI + small custom CSS
- CI runs privately on my NAS, workflows are not in this repo

## Docs

- [Architecture](./docs/ARCHITECTURE.md)
- [CI/CD strategy (private)](./docs/CI_STRATEGY.md)
- [Security notes](./docs/SECURITY.md)
- [Local setup](./docs/SETUP.md)

## Licence

MIT. See [LICENCE.md](./LICENCE.md).
