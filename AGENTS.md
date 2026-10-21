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
├── rapaglaz-portfolio/       # the Angular app (project.json, vitest.config.mts, public/, src/)
├── rapaglaz-portfolio-e2e/   # Playwright project (playwright.config.mts, src/)
└── workers/                  # Cloudflare Workers in TypeScript: one Nx project per Worker
libs/
├── portfolio/
│   ├── feature/              # @rapaglaz/portfolio/feature: PortfolioPage (lazy-loaded by the router), skills and certifications content
│   ├── layout/               # @rapaglaz/portfolio/layout: Portfolio (the shell), navbar, language switcher, footer
│   ├── ui/                   # @rapaglaz/portfolio/ui: hero, about, certifications, skills, languages, contact (inputs only)
│   └── util/                 # @rapaglaz/portfolio/util: contact links, email opener, CV file name
└── shared/
    ├── data-access/          # @rapaglaz/shared/data-access: protected download with Turnstile, feature flag, API URLs
    ├── ui/                   # @rapaglaz/shared/ui: badge, section wrapper with scroll reveal, toast
    ├── util/                 # @rapaglaz/shared/util: logger, i18n + dictionaries, stagger delay; two entry
    │                         # points keep the dictionaries out of the browser main chunk:
    │                         # /translations (server and test loader), /bootstrap-messages
    └── testing/              # @rapaglaz/shared/testing: Transloco test setup, window mocks
```

Libraries follow `libs/<scope>/<type>`; the type tag says what a library is when the name does
not (`portfolio/layout` is `type:feature`). Stores (NgRx SignalStore) go only to `data-access`
libraries.

Libraries are not buildable; the app compiles them from source through the aliases in
`tsconfig.base.json`. Add a library only for a second consumer or for a boundary that lint must
enforce. `@nx/angular:library` refuses Vitest 5, so a new library is a handful of short files that
point to shared configs; copy them from `libs/shared/ui`:

- `project.json`: name, paths, `scope:*` and `type:*` tags, `typecheck` with only the executor
- `eslint.config.mjs`, `src/test-setup.ts`
- `tsconfig.json` (references), `tsconfig.lib.json` and `tsconfig.spec.json` (one `extends` of
  `libs/tsconfig.*.base.json` each)
- `vitest.config.mts`: `angularVitestConfig(import.meta.dirname)` from `vitest.angular.mts`, which
  holds the AnalogJS setup, the `forks` pool and the coverage thresholds
- the alias in `tsconfig.base.json`; SonarCloud finds the coverage report by wildcard

The app itself is only the bootstrap: `app.ts` (renders `<app-portfolio />`), `app.config*.ts` and
`app.routes.ts`.

The shell (`Portfolio`) composes the navbar and the footer, and the navbar uses the language
switcher. The portfolio sections are presentational: the page passes them content and the feature
flag through inputs, and they do not import each other.

Imports between Nx projects are checked by `@nx/enforce-module-boundaries` through project tags
(`type:*`, and `scope:*` on libraries) in `eslint.module-boundaries.mjs`, shared by the root and
the Workers ESLint configs.

dependency-cruiser (`.dependency-cruiser.cjs`) checks the rules inside projects:

- no cycles; production files import neither specs nor `@rapaglaz/shared/testing`
- footer and language switcher do not import other layout pieces
- sections do not import each other; only `portfolio-feature` imports the section barrel; the
  portfolio content imports nothing

Only the router loads `@rapaglaz/portfolio/feature`, with a dynamic import: Nx rejects any static
import of a lazy-loaded library. Specs are exempt from the layer rules, type-only imports are
ignored. See [Dependency boundaries](./docs/DEPENDENCY_BOUNDARIES.md).

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
pnpm run test:watch      # unit in watch mode, all projects in one Vitest process
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

Languages: `en` (default), `de`. Translations in `libs/shared/util/src/lib/i18n/translations/{lang}.json`, copied to `/i18n/` by the build.
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
