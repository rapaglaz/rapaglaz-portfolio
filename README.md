# Paul Glaz Portfolio

Personal portfolio built with Angular 21.

## What's in here

- Angular 21, standalone components, signals
- Zoneless change detection (Zone.js is gone)
- SSG build (outputMode: static) with client hydration
- Transloco for i18n — runtime switching between English and German
- CV download flow: Cloudflare Turnstile → Worker → signed R2 URL
- Reusable UI stuff in `src/ui/`, shared logic in `src/services/`
- Vitest for unit tests, Playwright for E2E
- GitHub Actions with self-hosted runner (falls back to GitHub runners if offline)

## Stack

| Area          | What I use                                                 |
| ------------- | ---------------------------------------------------------- |
| **Framework** | Angular 21, TypeScript, RxJS, Signals                      |
| **Rendering** | SSG (Angular outputMode: static) + client hydration        |
| **i18n**      | Transloco (runtime)                                        |
| **Styling**   | Tailwind CSS 4 + DaisyUI + custom CSS                      |
| **Testing**   | Vitest (unit), Playwright (E2E), Lighthouse CI, SonarCloud |
| **CI/CD**     | GitHub Actions, self-hosted runner, pnpm                   |
| **Hosting**   | Cloudflare Workers, R2, Turnstile                          |

## Docs

- [**Architecture**](./docs/ARCHITECTURE.md) — how things are organised
- [**CI/CD Strategy**](./docs/CI_STRATEGY.md) — why the pipeline works this way
- [**Security**](./docs/SECURITY.md) — headers, Turnstile, signed URLs
- [**Setup**](./docs/SETUP.md) — running it locally

## Licence

MIT — use it, learn from it, whatever. Just give credit if you copy big parts.
See [`LICENCE.md`](./LICENCE.md) for details.
