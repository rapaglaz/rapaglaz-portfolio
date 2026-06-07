# Agent Guide — rapaglaz-portfolio

Reference for AI agents working in this repo. For broader context see [docs/](./docs/).

## Stack

- **Angular** v22 — zoneless, standalone, OnPush, SSG + hydration
- **TypeScript** v6.0, **Node.js** v24, **pnpm** v11.1.2
- **Tailwind CSS** v4.3 + **DaisyUI** v5.5 (CSS-first config in `src/styles.css`)
- **Transloco** v8.3 (i18n), **Valibot** v1.4 (schema validation), **RxJS** v7.8
- **Vitest** v4.1 (unit), **Playwright** v1.60 (E2E)

## Folder structure

```
src/app/
├── portfolio/      # top-level shell (lazy-loaded by router)
├── features/       # hero, navbar, about, skills, certifications, contact, footer
├── ui/             # reusable presentational pieces
├── services/       # cv-download, feature-flag, turnstile, toast, config, logger
├── interceptors/   # turnstile token injection
├── utils/          # i18n, rxjs, scroll, animation, tokens
├── content/        # typed static content (const objects)
└── testing/        # shared test helpers
```

No feature→feature imports. One exception: navbar→language-switcher.

## Conventions

- Class names: PascalCase **without** "Component" suffix — `export class Hero`, not `HeroComponent` (ESLint error)
- No NgModules — everything standalone
- `inject()` in class fields, not constructor injection
- `type` over `interface`
- `@if` / `@for` control flow — not `*ngIf` / `*ngFor`
- Signals for UI state, RxJS for async (HTTP, events, Turnstile)
- No `zone.js` — updates must be explicit
- Guard all browser API access with `isPlatformBrowser(PLATFORM_ID)`
- Validate all external HTTP responses with Valibot before use
- Log only via `LoggerService` — never expose internal errors to users, never log tokens or PII

## Quality gates — run before committing

```bash
pnpm run lint
pnpm run format:check
pnpm test
pnpm run i18n:check
```

Coverage thresholds: statements 80%, branches 70%, functions 80%, lines 80%.

## Tests

```bash
pnpm test                # unit (Vitest, watch)
pnpm run test:coverage   # unit with coverage report
pnpm run e2e             # Playwright against dev server (port 4200)
pnpm run e2e:ssg         # Playwright against static build (port 4233)
```

E2E uses helpers in `e2e/utils.ts` — `visitPortfolio()`, `mockFeatureFlag()`, `mockTurnstileAPI()`.
Do not commit `test.only`.

## Build

```bash
pnpm run build    # SSG → dist/rapaglaz-portfolio/browser
pnpm run preview  # serve the static build on port 4233
```

Bundle budgets: initial 700KB error, main bundle 230KB error, component styles 20KB error.

## i18n

Languages: `en` (default), `de`. Translations in `public/i18n/{lang}.json`.
Routes: `/en`, `/de`, root `/` falls back to `en`.
Never hardcode user-facing strings — use Transloco keys.

## Change policy

- One feature/fix per PR
- Get approval before mass refactors or folder restructuring
- When behaviour changes, update unit + E2E tests and verify coverage
- Never commit lockfile conflicts
