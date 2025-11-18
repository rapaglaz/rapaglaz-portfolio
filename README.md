# Paul Glaz Portfolio

Personal portfolio built with Angular 20.

Built the same way I'd build client work — proper typing, tests, CI gates, security headers. Just smaller scope.

I also use it to test new Angular features properly. Signals, zoneless mode, new build tooling — when something comes out, I try it here first.

## What's in here

- Angular 20, standalone components, signals everywhere
- Zoneless change detection (Zone.js is gone)
- Transloco for i18n — runtime switching between English and German
- CV download flow: Cloudflare Turnstile → Worker → signed R2 URL
- Reusable UI stuff in `src/ui/`, shared logic in `src/services/`
- Vitest for unit tests, Playwright for E2E
- GitHub Actions with self-hosted runner (falls back to GitHub runners if offline)

## Stack

| Area          | What I use                                                 |
| ------------- | ---------------------------------------------------------- |
| **Framework** | Angular 20, TypeScript, RxJS, Signals                      |
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

## Notes

Project is stable. I update it when Angular releases new features or when I want to try different configs.

Code quality is enforced through CI — coverage thresholds, lint rules, i18n validation. If something breaks the gates, it doesn't get merged.

## Licence

MIT — use it, learn from it, whatever. Just give credit if you copy big parts.
See [`LICENCE.md`](./LICENCE.md) for details.
