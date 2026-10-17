# Paul Glaz Portfolio

Source of [rapaglaz.de](https://rapaglaz.de), my personal site: a small bilingual (EN/DE) Angular 22
app, prerendered to static HTML and hydrated in the browser.

## Engineering decisions

- **Zoneless, signals for UI state, RxJS for async.** `zone.js` is not a dependency, so updates
  are explicit. Components are standalone and `OnPush`. The feature flag is an `httpResource`, so
  its value arrives as a signal and nothing subscribes manually.
- **Static prerendering + hydration.** `outputMode: static` prerenders `/`, `/en` and `/de` at
  build time. The client hydrates that HTML, so it does not repaint the whole page. Browser APIs
  are guarded with `isPlatformBrowser`, and the feature flag fires no request during prerender.
- **Layer boundaries enforced, not just documented.** dependency-cruiser checks runtime imports
  across seven layers, rejects feature-to-feature imports and cycles, and fails the CI lint job.
  The first report-only run found 11 warnings, including one cycle. The five remaining exceptions
  are file-level, because removing them would have turned the change into a production refactor.
- **External data is validated before use.** JSON from the `/config` and `/feature-flag` Workers
  goes through Valibot schemas. Invalid shapes are rejected instead of passed into the app; an
  unexpected flag value becomes `false`.
- **CV behind Turnstile and a Worker.** I don't want the CV to be a public URL that bots can scrape
  forever. The token travels in a `cf-turnstile-response` header set by an interceptor; the Worker
  (not in this repo) validates it with Cloudflare and streams the PDF from R2 with
  `Cache-Control: private, no-store`.
- **Tests aimed at the shipped artifact.** Vitest covers behaviour and error paths in services and
  interceptors, presentational sections get smoke checks. Playwright covers user flows, Turnstile
  failures, axe and contrast checks in EN/DE and light/dark, and reduced motion, on Desktop Chrome
  and an iPhone 12 WebKit profile. CI runs E2E against the static build, and main deploys exactly
  that artifact, without a rebuild.

Details: [engineering notes](./docs/ENGINEERING_NOTES.md) from the PR history.

## Quality gates

| Check                                                                        | Runs on  | Blocks                       |
| ---------------------------------------------------------------------------- | -------- | ---------------------------- |
| `format:check`, `lint`, `deps:check` (dependency-cruiser)                    | PR, main | yes                          |
| `i18n:check`, `test:coverage` (80% statements/functions/lines, 70% branches) | PR, main | yes                          |
| SSG build with bundle budgets from `angular.json`                            | PR, main | yes                          |
| Playwright E2E in the official Playwright container, against the build       | PR, main | yes                          |
| SonarCloud analysis (in the test job)                                        | PR, main | no, quality gate not awaited |
| actionlint, zizmor (workflow linting and security)                           | PR       | yes                          |
| Lighthouse, 3 desktop runs, median posted as a PR comment                    | PR       | no                           |

On PRs, the `quality-check` gate needs all of these except SonarCloud and Lighthouse. On main,
deploy needs lint, test, build and E2E; workflow linting runs only on PRs. Locally, Lefthook runs lint-staged before a commit (plus actionlint and zizmor
when workflows change) and commitlint on the message. Details: [CI/CD strategy](./docs/CI_STRATEGY.md).

## How I work with AI

Architecture, boundaries and code reviews are mine. I use Claude Code and Codex for implementation
speed and refactoring; `AGENTS.md` and `.claude/` are the guardrails I give them. Every change,
human or AI-assisted, has to pass lint, dependency-cruiser, unit and E2E tests before it lands.

## What I'd do differently

<!-- TODO(Paul): 2–3 honest points -->

## Also inside

- Transloco i18n with a runtime switch; JSON in `public/i18n`, locale routes `/en` and `/de`
- "Open to Work" feature flag from a Cloudflare Worker + KV
- Tailwind CSS 4 + DaisyUI + small custom CSS

## Docs

- [Architecture](./docs/ARCHITECTURE.md)
- [Engineering notes](./docs/ENGINEERING_NOTES.md)
- [Dependency boundaries](./docs/DEPENDENCY_BOUNDARIES.md)
- [CI/CD strategy](./docs/CI_STRATEGY.md)
- [Security notes](./docs/SECURITY.md)
- [Local setup](./docs/SETUP.md)

## Licence

MIT. See [LICENCE.md](./LICENCE.md).
