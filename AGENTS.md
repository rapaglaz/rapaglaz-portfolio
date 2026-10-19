# Agent Guide — rapaglaz-portfolio

Reference for AI agents working in this repo. For broader context see [docs/](./docs/).

## Stack

Exact versions live in `package.json` (dependencies, `packageManager` for pnpm), `.nvmrc`
(Node.js) and `mise.toml` (actionlint, zizmor). Majors are listed only where they shape the code.

- **Angular 22** — zoneless, standalone, OnPush, SSG + hydration
- **Nx 23** — workspace, task runner and local cache; no Nx Cloud
- **TypeScript**, **Node.js 24**, **pnpm**
- **Tailwind CSS 4** + **DaisyUI 5** (CSS-first config in `apps/rapaglaz-portfolio/src/styles.css`)
- **Transloco** (i18n), **Valibot 1** (schema validation, `v.pipe` API), **RxJS**
- **Vitest** (unit, through `@nx/vitest` and AnalogJS), **Playwright** (E2E, through `@nx/playwright`)

## Folder structure

```text
apps/
├── rapaglaz-portfolio/       # the Angular app (project.json, vite.config.mts, public/, src/)
├── rapaglaz-portfolio-e2e/   # Playwright project (playwright.config.mts, src/)
└── workers/                  # Cloudflare Workers: one Nx project per Worker (test, check, deploy)
libs/
└── shared/
    ├── util/                 # @rapaglaz/shared/util: logger, API tokens, i18n + dictionaries, animation, contact
    └── testing/              # @rapaglaz/shared/testing: Transloco test setup, window mocks
```

Libraries are not buildable; the app compiles them from source through the aliases in
`tsconfig.base.json`. `@nx/angular:library` refuses Vitest 5, so a new library copies
`project.json`, `eslint.config.mjs`, the tsconfigs, `vite.config.mts` and `src/test-setup.ts` from
an existing one.

Inside the app:

```text
apps/rapaglaz-portfolio/src/app/
├── portfolio/      # top-level shell (lazy-loaded by router)
├── features/       # hero, navbar, language-switcher, about, skills, languages, certifications, contact, footer
├── ui/             # reusable presentational pieces
├── services/       # cv-download, feature-flag, turnstile, toast, config
├── interceptors/   # turnstile token injection
├── utils/          # rxjs, layout
└── content/        # typed static content (const objects)
```

No feature→feature imports. One exception: navbar→language-switcher.

Imports between Nx projects are checked by `@nx/enforce-module-boundaries` through project tags
(`type:*`, and `scope:*` on libraries) in `eslint.module-boundaries.mjs`, shared by the root and
the Workers ESLint configs.

Runtime layer boundaries and circular dependencies are checked by dependency-cruiser in
`.dependency-cruiser.cjs`. Content stays within its own layer; utils cannot depend on higher layers;
UI uses utils; services use utils and content; interceptors use services and utils; features use
UI, services, utils, and content; portfolio composes features and UI. Imports within a layer are
allowed. Only specs may import `@rapaglaz/shared/testing`, and production files cannot import
specs. Specs are exempt from layer rules, while cycles are errors and orphans are warnings.
Type-only imports are ignored. Narrow exceptions for overlays and routing are documented in [Dependency boundaries](./docs/DEPENDENCY_BOUNDARIES.md).

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
pnpm run typecheck
pnpm run deps:check
pnpm run format:check
pnpm test
pnpm run test:workers
pnpm run workers:check
pnpm run i18n:check
```

The scripts run their targets through Nx. To run a target directly: `pnpm nx <target> <project>`,
for example `pnpm nx test rapaglaz-portfolio` or `pnpm nx test shared-util`.

Coverage thresholds: statements 80%, branches 70%, functions 80%, lines 80%.

## Tests

```bash
pnpm test                # unit (Vitest, single run) for the app and the libraries
pnpm run test:watch      # unit in watch mode
pnpm run test:coverage   # unit with coverage report
pnpm run e2e             # Playwright against dev server (port 4200)
pnpm run e2e:ssg         # Playwright against static build (port 4233)
```

E2E uses helpers in `apps/rapaglaz-portfolio-e2e/src/utils.ts` — `visitPortfolio()`, `mockFeatureFlag()`, `mockTurnstileAPI()`.
Do not commit `test.only`.

## Build

```bash
pnpm run build    # SSG → dist/apps/rapaglaz-portfolio/browser
pnpm run preview  # serve the static build on port 4233
```

Bundle budgets (`apps/rapaglaz-portfolio/project.json`): initial 750KB error, all scripts 650KB error, any component style 20KB error.
The warnings (600KB initial, 575KB all scripts) leave room for NgRx.

## i18n

Languages: `en` (default), `de`. Translations in `libs/shared/util/src/i18n/{lang}.json`, copied to `/i18n/` by the build.
Routes: `/en`, `/de`, root `/` falls back to `en`.
Never hardcode user-facing strings — use Transloco keys.
A key built at runtime or passed as an input must also appear in a `/** t(key) */` (TS) or
`<!-- t(key) -->` (HTML) comment next to its use; otherwise `i18n:check` reports it as unused.

## Change policy

- One feature/fix per PR
- Get approval before mass refactors or folder restructuring
- When behaviour changes, update unit + E2E tests and verify coverage
- Never commit lockfile conflicts
- Work on a branch, never commit to `main`
- Never push, force-push or open a PR without the maintainer's approval
- A task is finished only when the quality gates above pass; report a failing gate instead of
  skipping or disabling it

## AI tooling

- Do not run `nx configure-ai-agents` for Claude: it copies the block below into `CLAUDE.md` and adds
  the Nx marketplace plugin, which duplicates `.mcp.json` and the skills in `.agents/skills`.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
