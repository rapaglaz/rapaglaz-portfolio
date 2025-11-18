# Paul Glaz Portfolio

Personal portfolio built with Angular 20.

This is not a demo project or some tutorial code. It's more like what I'd actually build for client work, just smaller scope.

I also use it when new Angular features come out to test them properly. Signals, zoneless mode, new build stuff — things like that.

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

The project is pretty stable. I change stuff when Angular releases something new or when I want to try different configs. Nothing crazy.

Some parts aren't perfect but I keep it clean and practical enough.

## Licence

MIT — use it, learn from it, whatever. Just give credit if you copy big parts.
See [`LICENCE.md`](./LICENCE.md) for details.
