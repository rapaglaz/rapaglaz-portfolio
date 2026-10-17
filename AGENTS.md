# Agent Guide — rapaglaz-portfolio

Reference for AI agents working in this repo. For broader context see [docs/](./docs/).

## Stack

Exact versions live in `package.json` (dependencies, `packageManager` for pnpm), `.nvmrc`
(Node.js) and `mise.toml` (actionlint, zizmor). Majors are listed only where they shape the code.

- **Angular 22** — zoneless, standalone, OnPush, SSG + hydration
- **TypeScript**, **Node.js 24**, **pnpm**
- **Tailwind CSS 4** + **DaisyUI 5** (CSS-first config in `src/styles.css`)
- **Transloco** (i18n), **Valibot 1** (schema validation, `v.pipe` API), **RxJS**
- **Vitest** (unit), **Playwright** (E2E)

## Folder structure

```
src/app/
├── portfolio/      # top-level shell (lazy-loaded by router)
├── features/       # hero, navbar, language-switcher, about, skills, languages, certifications, contact, footer
├── ui/             # reusable presentational pieces
├── services/       # cv-download, feature-flag, turnstile, toast, config, logger
├── interceptors/   # turnstile token injection
├── utils/          # i18n, rxjs, scroll, animation, layout, tokens, contact
├── content/        # typed static content (const objects)
└── testing/        # shared test helpers
```

No feature→feature imports. One exception: navbar→language-switcher.

Runtime layer boundaries and circular dependencies are checked by dependency-cruiser in
`.dependency-cruiser.cjs`. Content stays within its own layer; utils cannot depend on higher layers;
UI uses utils; services use utils and content; interceptors use services and utils; features use
UI, services, utils, and content; portfolio composes features and UI. Imports within a layer are
allowed. Only specs and testing helpers may import `testing`, and production files cannot import
specs. Specs are exempt from layer rules, while cycles are errors and orphans are warnings.
Type-only imports are ignored. Narrow exceptions for logging, overlays, SEO, and routing are
documented in [Dependency boundaries](./docs/DEPENDENCY_BOUNDARIES.md).

## Conventions

- Class names: PascalCase **without** "Component" suffix — `export class Hero`, not `HeroComponent` (ESLint error)
- No NgModules — everything standalone
- `inject()` in class fields, not constructor injection
- `type` over `interface`
- `@if` / `@for` control flow — not `*ngIf` / `*ngFor`
- Signals for UI state, RxJS for async (HTTP, events, Turnstile); feature flag uses `httpResource`
- No `zone.js` — updates must be explicit
- Guard all browser API access with `isPlatformBrowser(PLATFORM_ID)`
- Validate all external HTTP responses with Valibot before use
- Log only via `LoggerService` — never expose internal errors to users, never log tokens or PII

## Quality gates — run before committing

```bash
pnpm run lint
pnpm run deps:check
pnpm run format:check
pnpm test
pnpm run test:workers
pnpm run workers:check
pnpm run i18n:check
```

Coverage thresholds: statements 80%, branches 70%, functions 80%, lines 80%.

## Tests

```bash
pnpm test                # unit (Vitest, single run)
pnpm run test:watch      # unit in watch mode
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

Bundle budgets (`angular.json`): initial 700KB error, all scripts 500KB error, any component style 20KB error.

## i18n

Languages: `en` (default), `de`. Translations in `public/i18n/{lang}.json`.
Routes: `/en`, `/de`, root `/` falls back to `en`.
Never hardcode user-facing strings — use Transloco keys.

## Change policy

- One feature/fix per PR
- Get approval before mass refactors or folder restructuring
- When behaviour changes, update unit + E2E tests and verify coverage
- Never commit lockfile conflicts
- Work on a branch, never commit to `main`
- Never push, force-push or open a PR without the maintainer's approval
- A task is finished only when the quality gates above pass; report a failing gate instead of
  skipping or disabling it
