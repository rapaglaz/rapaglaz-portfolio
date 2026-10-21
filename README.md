# My Portfolio

Source of [rapaglaz.de](https://rapaglaz.de), my personal site: a small bilingual (EN/DE) Angular 22
app, prerendered to static HTML and hydrated in the browser.

## Engineering decisions

- **Zoneless, signals for UI state, RxJS for async.** `zone.js` is not a dependency, so updates
  are explicit. Components are standalone and `OnPush`. The feature flag is an `httpResource`, so
  its value arrives as a signal and nothing subscribes manually.
- **Static prerendering + hydration.** `outputMode: static` prerenders `/`, `/en` and `/de` at
  build time. The client hydrates that HTML, so it does not repaint the whole page. Browser APIs
  are guarded with `isPlatformBrowser`, and the feature flag fires no request during prerender.
- **Nx workspace with enforced boundaries.** The app is only the bootstrap; the page, layout,
  sections and shared code are libraries in `libs/<scope>/<type>`, compiled from source. Two
  checks fail the CI lint job: `@nx/enforce-module-boundaries` checks imports between projects
  through `type:*` and `scope:*` tags, and dependency-cruiser rejects cycles, imports between
  sections and production imports of specs or test helpers. The first dependency-cruiser run
  found 11 warnings, including one cycle; no exceptions are left.
- **External data is validated before use.** JSON from the `/config` and `/feature-flag` Workers
  goes through Valibot schemas. Invalid shapes are rejected instead of passed into the app; an
  unexpected flag value becomes `false`.
- **CV behind Turnstile and a Worker.** I don't want the CV to be a public URL that bots can scrape
  forever. The token travels in a `cf-turnstile-response` header set by an interceptor; the
  [Worker](./apps/workers/cv-download/) validates it with Cloudflare and streams the PDF from R2 with
  `Cache-Control: private, no-store`.
- **Tests aimed at the shipped artifact.** Vitest covers behaviour and error paths in services and
  interceptors, presentational sections get smoke checks. Playwright covers user flows, Turnstile
  failures, axe and contrast checks in EN/DE and light/dark, and reduced motion, on Desktop Chrome
  and an iPhone 12 WebKit profile; the CV download also runs with a Pixel 7 profile. CI runs E2E
  against the static build, and main deploys exactly that artifact, without a rebuild.

Decision records: [docs/adr](./docs/adr/). What went wrong and how it was fixed, from the PR
history: [engineering notes](./docs/ENGINEERING_NOTES.md).

## Quality gates

| Check                                                                        | Runs on  | Blocks                       |
| ---------------------------------------------------------------------------- | -------- | ---------------------------- |
| `format:check`, `lint`, `typecheck`, `deps:check` (dependency-cruiser)       | PR, main | yes                          |
| `i18n:check`, `test:coverage` (80% statements/functions/lines, 70% branches) | PR, main | yes                          |
| `test:workers`, `workers:check` (Worker specs, `wrangler deploy --dry-run`)  | PR, main | yes                          |
| SSG build with bundle budgets from `apps/rapaglaz-portfolio/project.json`    | PR, main | yes                          |
| Playwright E2E against the build, Chromium and WebKit                        | PR, main | yes                          |
| SonarCloud analysis (in the test job)                                        | PR, main | no, quality gate not awaited |
| actionlint, zizmor (workflow linting and security)                           | PR       | yes                          |
| Lighthouse, 3 desktop runs, median posted as a PR comment                    | PR       | no                           |

On PRs, the `quality-check` gate needs all of these except SonarCloud and Lighthouse. On main,
deploy needs lint, test, build and E2E; workflow linting runs only on PRs. Locally, Lefthook runs lint-staged before a commit (plus actionlint and zizmor
when workflows change) and commitlint on the message. Details: [CI/CD strategy](./docs/CI_STRATEGY.md).

## How I work with AI

Architecture, boundaries and code reviews are mine. I use Claude Code and Codex for implementation
speed and refactoring; `AGENTS.md` and `.claude/` are the guardrails I give them. Pull requests,
human or AI-assisted, merge only after the required `quality-check` gate (lint, dependency-cruiser,
unit and E2E tests), and every push to main outside the docs runs the same checks before it
deploys. Not everything went through a pull request: I committed some changes straight to main,
including the Nx migration on 2026-10-19, and as repository admin I bypassed the gate for four
PRs: [#712](https://github.com/rapaglaz/rapaglaz-portfolio/pull/712),
[#713](https://github.com/rapaglaz/rapaglaz-portfolio/pull/713),
[#730](https://github.com/rapaglaz/rapaglaz-portfolio/pull/730) and
[#768](https://github.com/rapaglaz/rapaglaz-portfolio/pull/768).

## What I'd do differently

<!-- TODO(Paul): 2–3 honest points -->

## Also inside

- Transloco i18n with a runtime switch; JSON in `libs/shared/util/src/i18n`, locale routes `/en` and `/de`
- "Open to Work" feature flag from a Cloudflare Worker + KV
- Tailwind CSS 4 + DaisyUI + small custom CSS

## Docs

- [Architecture](./docs/ARCHITECTURE.md)
- [Decision records](./docs/adr/)
- [Engineering notes](./docs/ENGINEERING_NOTES.md)
- [Dependency boundaries](./docs/DEPENDENCY_BOUNDARIES.md)
- [CI/CD strategy](./docs/CI_STRATEGY.md)
- [Security notes](./docs/SECURITY.md)
- [Cloudflare Workers](./apps/workers/README.md)
- [Local setup](./docs/SETUP.md)

## Licence

MIT. See [LICENCE.md](./LICENCE.md).
