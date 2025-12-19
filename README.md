# Paul Glaz Portfolio

My personal portfolio site.

Built with Angular 21. It is mostly presentational sections (Hero/About/Skills/etc), but I still treat the plumbing like a real app.

## What’s inside

- Angular 21 (standalone components, signals)
- Zoneless setup (no Zone.js)
- Static build (SSG via `outputMode: static`) + client hydration
- Transloco i18n (runtime switch between EN/DE)
- CV download flow: Turnstile → Worker → signed R2 URL
- Feature flag for the “Open to Work” badge (Worker + KV, runtime)
- Unit tests with Vitest, E2E with Playwright
- CI in GitHub Actions, usually on a self-hosted runner (fallback to GitHub runners if it is offline)

## Stack (short)

| Area      | What                                        |
| --------- | ------------------------------------------- |
| Framework | Angular 21, TypeScript, RxJS, Signals       |
| Rendering | SSG + hydration                             |
| i18n      | Transloco (runtime)                         |
| Styling   | Tailwind CSS 4 + DaisyUI + small custom CSS |
| Testing   | Vitest, Playwright, Lighthouse CI           |
| CI/CD     | GitHub Actions + pnpm                       |

## Docs

- [Architecture](./docs/ARCHITECTURE.md)
- [CI/CD strategy](./docs/CI_STRATEGY.md)
- [Security notes](./docs/SECURITY.md)
- [Local setup](./docs/SETUP.md)

## Licence

MIT. See [LICENCE.md](./LICENCE.md).
