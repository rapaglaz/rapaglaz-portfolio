# My Portfolio

Source code of [rapaglaz.de](https://rapaglaz.de), my personal site. It is a small bilingual
(EN/DE) Angular 22 application, prerendered to static HTML and hydrated in the browser.

## Engineering decisions

- **Zoneless, signals for UI state, RxJS for async work.** There is no `zone.js`, so every update is
  explicit. Components are standalone and `OnPush`. The feature flag is an `httpResource`: its value
  comes as a signal, and no code subscribes manually.
- **Static prerendering and hydration.** The build prerenders `/`, `/en` and `/de`, and the client
  hydrates this HTML instead of rendering the page again. Access to browser APIs is guarded with
  `isPlatformBrowser`, and the prerender sends no feature flag request.
- **Nx workspace with enforced boundaries.** The application contains only the bootstrap. The page,
  the layout, the sections and the shared code are libraries in `libs/<scope>/<type>`. Two checks
  fail the lint job: `@nx/enforce-module-boundaries` for imports between projects (`type:*` and
  `scope:*` tags), and dependency-cruiser for cycles, imports between sections and imports of test
  code in production code.
- **Validation of external data.** JSON from the `/config` and `/feature-flag` Workers goes through
  Valibot schemas. An invalid shape is rejected, and an unexpected flag value becomes `false`.
- **CV behind Turnstile and a Worker.** The CV is not a public URL, because bots could download it
  without any limit. An interceptor sends the Turnstile token in a request header. The
  [Worker](./apps/workers/cv-download/) validates the token with Cloudflare and streams the PDF from
  R2 with `Cache-Control: private, no-store`.
- **Tests for the deployed build.** Vitest covers the behavior and the error paths of services and
  interceptors, and the sections have smoke tests. Playwright covers user flows, Turnstile errors,
  axe and contrast checks in EN/DE and in light and dark mode, and reduced motion. It runs on a
  Desktop Chrome profile and an iPhone 12 WebKit profile, plus the CV download on a Pixel 7 profile.
  CI tests the static build, and `main` deploys exactly this build.

The decisions are recorded in [docs/adr](./docs/adr/). Problems from the PR history and their fixes
are in the [engineering notes](./docs/ENGINEERING_NOTES.md).

## Quality gates

| Check                                                                         | Runs on  | Blocks                              |
| ----------------------------------------------------------------------------- | -------- | ----------------------------------- |
| `format:check`, `lint`, `typecheck`, `deps:check` (dependency-cruiser)        | PR, main | yes                                 |
| `i18n:check`, `test:coverage` (80% statements/functions/lines, 70% branches)  | PR, main | yes                                 |
| `test:workers`, `workers:check` (Worker specs, `wrangler deploy --dry-run`)   | PR, main | yes                                 |
| SSG build with the bundle budgets from `apps/rapaglaz-portfolio/project.json` | PR, main | yes                                 |
| Playwright E2E against the build, Chromium and WebKit                         | PR, main | yes                                 |
| SonarCloud analysis (`sonar` job, after `test`)                               | PR, main | no, the quality gate is not awaited |
| actionlint, zizmor (linting and security of the workflows)                    | PR, main | on PRs (in the `lint` job)          |
| Lighthouse, 3 desktop runs, median as a PR comment                            | PR       | no                                  |

On PRs, the `quality-check` gate needs every check except SonarCloud and Lighthouse. On `main`, the
deploy needs lint, test, build and E2E. Locally, Lefthook runs lint-staged before each commit (plus
actionlint and zizmor when a workflow changes) and commitlint on the commit message. Details:
[CI/CD strategy](./docs/CI_STRATEGY.md).

## How I work with AI

I own the architecture, the boundaries and the code reviews. I use Claude Code and Codex for
implementation speed and for refactoring, and `AGENTS.md` and `.claude/` define the rules for these
tools. Pull requests, written by me or with AI assistance, are merged only after the required
`quality-check` gate (lint, dependency-cruiser, unit and E2E tests). Every push to `main` outside
the docs runs the same checks before the deploy.

Not every change went through a pull request. I committed some changes directly to `main`,
including the Nx migration on 2026-10-19. As repository admin, I also bypassed the gate for four
PRs: [#712](https://github.com/rapaglaz/rapaglaz-portfolio/pull/712),
[#713](https://github.com/rapaglaz/rapaglaz-portfolio/pull/713),
[#730](https://github.com/rapaglaz/rapaglaz-portfolio/pull/730) and
[#768](https://github.com/rapaglaz/rapaglaz-portfolio/pull/768).

## Other features

- Transloco i18n with a language switch at runtime and the locale routes `/en` and `/de`
- an "Open to Work" feature flag from a Cloudflare Worker and KV
- Tailwind CSS 4, DaisyUI and a small amount of custom CSS

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
