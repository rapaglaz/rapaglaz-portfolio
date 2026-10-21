# My Portfolio

Source of [rapaglaz.de](https://rapaglaz.de), my personal site: a small bilingual (EN/DE) Angular 22
app, prerendered to static HTML and hydrated in the browser.

## Engineering decisions

- **Zoneless, signals for UI state, RxJS for async.** There is no `zone.js`, so updates are
  explicit. Components are standalone and `OnPush`. The feature flag is an `httpResource`: its value
  arrives as a signal, and nothing subscribes manually.
- **Static prerendering and hydration.** The build prerenders `/`, `/en` and `/de`, and the client
  hydrates that HTML instead of repainting the page. Browser APIs are guarded with
  `isPlatformBrowser`, and prerender sends no feature flag request.
- **Nx workspace with enforced boundaries.** The app is only the bootstrap. The page, layout,
  sections and shared code are libraries in `libs/<scope>/<type>`. Two checks fail the lint job:
  `@nx/enforce-module-boundaries` for imports between projects (`type:*` and `scope:*` tags), and
  dependency-cruiser for cycles, imports between sections and production imports of test code.
- **External data is validated.** JSON from the `/config` and `/feature-flag` Workers goes through
  Valibot schemas. Invalid shapes are rejected, and an unexpected flag value becomes `false`.
- **CV behind Turnstile and a Worker.** I don't want the CV to be a public URL that bots can scrape
  forever. An interceptor sends the Turnstile token in a header; the
  [Worker](./apps/workers/cv-download/) validates it with Cloudflare and streams the PDF from R2 with
  `Cache-Control: private, no-store`.
- **Tests aimed at what ships.** Vitest covers behavior and error paths in services and
  interceptors, and the sections get smoke tests. Playwright covers user flows, Turnstile failures,
  axe and contrast checks in EN/DE and light/dark, and reduced motion. It runs on Desktop Chrome and
  an iPhone 12 WebKit profile, plus the CV download on a Pixel 7 profile. CI tests the static build,
  and `main` deploys exactly that build.

The decisions are recorded in [docs/adr](./docs/adr/). Problems and fixes from the PR history are in
the [engineering notes](./docs/ENGINEERING_NOTES.md).

## Quality gates

| Check                                                                        | Runs on  | Blocks                       |
| ---------------------------------------------------------------------------- | -------- | ---------------------------- |
| `format:check`, `lint`, `typecheck`, `deps:check` (dependency-cruiser)       | PR, main | yes                          |
| `i18n:check`, `test:coverage` (80% statements/functions/lines, 70% branches) | PR, main | yes                          |
| `test:workers`, `workers:check` (Worker specs, `wrangler deploy --dry-run`)  | PR, main | yes                          |
| SSG build with bundle budgets from `apps/rapaglaz-portfolio/project.json`    | PR, main | yes                          |
| Playwright E2E against the build, Chromium and WebKit                        | PR, main | yes                          |
| SonarCloud analysis (`sonar` job, after `test`)                              | PR, main | no, quality gate not awaited |
| actionlint, zizmor (workflow linting and security)                           | PR, main | on PRs (in the `lint` job)   |
| Lighthouse, 3 desktop runs, median posted as a PR comment                    | PR       | no                           |

On PRs, the `quality-check` gate needs everything except SonarCloud and Lighthouse. On `main`, the
deploy needs lint, test, build and E2E. Locally, Lefthook runs lint-staged before each commit (plus
actionlint and zizmor when workflows change) and commitlint on the message. Details:
[CI/CD strategy](./docs/CI_STRATEGY.md).

## How I work with AI

Architecture, boundaries and code reviews are mine. I use Claude Code and Codex for implementation
speed and refactoring; `AGENTS.md` and `.claude/` are the guardrails I give them. Pull requests,
human or AI-assisted, merge only after the required `quality-check` gate (lint, dependency-cruiser,
unit and E2E tests), and every push to `main` outside the docs runs the same checks before it
deploys. Not everything went through a pull request: I committed some changes straight to `main`,
including the Nx migration on 2026-10-19, and as repository admin I bypassed the gate for four
PRs: [#712](https://github.com/rapaglaz/rapaglaz-portfolio/pull/712),
[#713](https://github.com/rapaglaz/rapaglaz-portfolio/pull/713),
[#730](https://github.com/rapaglaz/rapaglaz-portfolio/pull/730) and
[#768](https://github.com/rapaglaz/rapaglaz-portfolio/pull/768).

## Also inside

- Transloco i18n with a runtime language switch and the locale routes `/en` and `/de`
- an "Open to Work" feature flag from a Cloudflare Worker and KV
- Tailwind CSS 4, DaisyUI and a little custom CSS

## Docs

- [Architecture](./docs/ARCHITECTURE.md)
- [Decision records](./docs/adr/)
- [Engineering notes](./docs/ENGINEERING_NOTES.md)
- [Dependency boundaries](./docs/DEPENDENCY_BOUNDARIES.md)
- [CI/CD strategy](./docs/CI_STRATEGY.md)
- [Security notes](./docs/SECURITY.md)
- [Cloudflare Workers](./apps/workers/README.md)
- [Local setup](./docs/SETUP.md)

## License

MIT. See [LICENCE.md](./LICENCE.md).
