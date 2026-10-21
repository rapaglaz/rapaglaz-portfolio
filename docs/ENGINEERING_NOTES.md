# Engineering notes

Problems from this repo's history, oldest first, with the PRs that fixed them.

## Cached config error never cleared (2026-07-05)

- **Problem:** after one failed retry sequence, every later `getConfig()` call replayed the error
  without an HTTP request until a full page reload.
- **Cause:** the errored observable stayed cached in `shareReplay({ refCount: false })`.
- **Fix:** reset the cached observable on error so the next call fetches again, with a spec for
  it. [#500](https://github.com/rapaglaz/rapaglaz-portfolio/pull/500)

<!-- TODO(Paul): What did you take away from this? -->

## E2E test passed through the wrong path (2026-07-05)

- **Problem:** "handles Turnstile verification error" ran the script-load-failure path, so it was
  a duplicate of the next test and the error callback was never exercised.
- **Cause:** its `addInitScript` mock was registered after `visitPortfolio` had loaded the page,
  so the mock never ran.
- **Fix:** install the mock before navigation through a shared `mockTurnstileAPI(page, 'error')`
  outcome instead of an inline copy. [#503](https://github.com/rapaglaz/rapaglaz-portfolio/pull/503)

<!-- TODO(Paul): What did you take away from this? -->

## Deploy shipped a rebuild, not the tested build (2026-07-05 to 2026-09-06)

- **Problem:** the release workflow built whatever `main` pointed at when it started and shipped
  that rebuild, not the artifact E2E had run against.
- **Cause:** deploy was a separate `workflow_run` workflow (`release.yaml`) with its own build job,
  triggered by the main branch checks.
- **Fix:** check out the validated `head_sha`
  ([#502](https://github.com/rapaglaz/rapaglaz-portfolio/pull/502)), then download
  `build-artifact-main` from the triggering run instead of rebuilding
  ([#509](https://github.com/rapaglaz/rapaglaz-portfolio/pull/509)). Later the deploy moved into
  `main-branch-ci-cd.yaml` as a job that needs lint, test, build and e2e and reuses the artifact
  directly ([#663](https://github.com/rapaglaz/rapaglaz-portfolio/pull/663)).

<!-- TODO(Paul): What did you take away from this? -->

## Bundle budget warned on every build (2026-07-05)

- **Problem:** every production build warned: initial was 539.5 kB raw against a 500 kB warning
  budget.
- **Cause:** measured with `stats.json`: 153 kB `@angular/core`, 66 kB router, 66 kB CDK (about
  39 kB of it overlay + portal), 35 kB common. No low-complexity cut got back under 500 kB.
- **Fix:** raise the warning budget to 560 kB and keep the 700 kB error.
  [#512](https://github.com/rapaglaz/rapaglaz-portfolio/pull/512)

<!-- TODO(Paul): What did you take away from this? -->

## jsdom minor release broke unit tests (2026-09-23 to 2026-10-12)

- **Problem:** after the jsdom 30.1.0 bump
  ([#708](https://github.com/rapaglaz/rapaglaz-portfolio/pull/708)), the `CvDownloadService` unit
  test failed with `Cannot read properties of undefined (reading '_buffer')` and main CI broke.
- **Cause:** jsdom 30.1.0 moved its WebIDL wrapper internals from a symbol-keyed property to a
  WeakMap registry. Vitest 4.1.11's `URL.createObjectURL`/Blob shim read `blob[implSymbol]._buffer`
  directly. Vitest 5.0.1 had the same shim and was blocked by the `vitest: ^4.0.8` peer range of
  `@angular/build`.
- **Fix:** pin jsdom to 30.0.1 and hold it below 30.1.0 in Renovate
  ([#712](https://github.com/rapaglaz/rapaglaz-portfolio/pull/712)). Vitest went to 5.0.2 and the
  Renovate hold was removed in [#730](https://github.com/rapaglaz/rapaglaz-portfolio/pull/730);
  the jsdom pin itself moved to 30.1.2 in
  [#766](https://github.com/rapaglaz/rapaglaz-portfolio/pull/766).

<!-- TODO(Paul): What did you take away from this? -->

## Playwright image and package drifted apart, three times (2026-07-05 to 2026-10-12)

- **Problem:** the `mcr.microsoft.com/playwright` image in CI and `@playwright/test` in
  `package.json` must match exactly, and they did not, for three different reasons.
- **Cause:**
  - The Renovate custom manager still watched `e2e.yaml`, removed in #437, so the image stopped
    being updated ([#501](https://github.com/rapaglaz/rapaglaz-portfolio/pull/501)).
  - #711 bumped `@playwright/test` to 1.62.0 while the workflows stayed on `v1.61.1-noble`, and
    `browserType.launch` failed with "Executable doesn't exist". It went unnoticed because
    `e2e-tests` was skipped for `renovate/*` PRs
    ([#713](https://github.com/rapaglaz/rapaglaz-portfolio/pull/713)).
  - The image has no release timestamp, so `minimumReleaseAge` with `internalChecksFilter: strict`
    filtered it out of the Playwright group and produced npm-only PRs
    ([#768](https://github.com/rapaglaz/rapaglaz-portfolio/pull/768)).
- **Fix:** widen the custom manager to all workflow files (#501), pin the image to
  `v1.62.0-noble` (#713), run unit tests and E2E on every PR and fail the gate on skipped jobs
  ([#730](https://github.com/rapaglaz/rapaglaz-portfolio/pull/730)), and keep the image in the
  same Renovate PR as the package (#768).

<!-- TODO(Paul): What did you take away from this? -->

## Workflow findings from zizmor (2026-10-08)

- **Problem:** zizmor reported findings in the workflows, so its CI job and pre-commit hook ran
  report-only (`continue-on-error: true`, `--no-exit-codes`).
- **Cause:** the build action expanded `${{ inputs.base-href }}` directly inside the shell
  script, and every `actions/checkout` persisted credentials.
- **Fix:** pass the input through `env`, set `persist-credentials: false` on all checkouts, add
  `.github/zizmor.yml` with one disabled rule and one ignored line, each with a reason, and drop
  both report-only switches. [#754](https://github.com/rapaglaz/rapaglaz-portfolio/pull/754)

<!-- TODO(Paul): What did you take away from this? -->

## Layer rules were not enforced (2026-10-10)

- **Problem:** the first dependency-cruiser run, with every rule at `warn`, reported 11 warnings
  across 81 modules, including one circular import.
- **Cause:** `utils/i18n/transloco-missing-handler.ts` imported the services barrel, which led
  back through `cv-download.service.ts` into `utils/i18n`.
- **Fix:** import the logger file directly, allow five narrow file-level exceptions, set all
  boundary and cycle rules to `error`, and run `deps:check` in the lint job. Two temporary probes
  (a cross-feature import and a cycle) confirmed exit code 1.
  [#756](https://github.com/rapaglaz/rapaglaz-portfolio/pull/756), details in
  [Dependency boundaries](./DEPENDENCY_BOUNDARIES.md)

<!-- TODO(Paul): What did you take away from this? -->

## Initial bundle over the warning budget again (2026-10-17)

- **Problem:** the production build reported 579.50 kB initial on `main`, over the 560 kB warning
  budget set in #512.
- **Cause:** Tailwind scanned Markdown and E2E files and generated DaisyUI components that no
  template uses (`table`, `toggle`, `steps`). The CDK overlay, portal and dialog sat in the initial
  chunk, although only a toast or the CV verification needs them.
- **Fix:** limit Tailwind to `src/` with `source('.')`, which takes the stylesheet from 98.50 kB to
  86.28 kB ([#773](https://github.com/rapaglaz/rapaglaz-portfolio/pull/773)). Then load the CDK
  packages on demand through local re-export modules: initial 503.94 kB, all scripts 487.98 kB
  ([#776](https://github.com/rapaglaz/rapaglaz-portfolio/pull/776)). A first attempt with
  `import('@angular/cdk/overlay')` kept the whole CDK namespaces and pushed all scripts to
  540.43 kB, over the 500 kB error budget.

## Worker accepted the test token from any client (2026-10-17)

- **Problem:** the CV download Worker skipped `siteverify` for Cloudflare's public test token when
  Origin or Referer contained `localhost`, and three made-up tokens paused verification of real
  tokens for five minutes on that isolate.
- **Cause:** local dev calls the production Worker with the test site key, so the bypass was keyed
  on headers the client controls. The circuit breaker counted rejected tokens as outages.
- **Fix:** only `ALLOW_TEST_TOKEN` on a development Worker skips `siteverify`, the breaker counts
  only `siteverify` outages, and local origins are compared by hostname. Found while adding the
  Worker sources to this repo; `workers/cv-download/index.spec.js` reproduces each case.
  [#777](https://github.com/rapaglaz/rapaglaz-portfolio/pull/777)

## Same origin check left in a second Worker (2026-10-18)

- **Problem:** after #777, `portfolio-settings` still matched `localhost` as a substring, so
  `https://evil-localhost.example` received an `Access-Control-Allow-Origin` header for `/config`.
  `feature-flag` threw an unhandled `URIError` for a malformed escape such as `%E0%A4%A`.
- **Cause:** #777 fixed and tested only `cv-download`; the other two Workers had no behaviour tests.
- **Fix:** compare the parsed hostname, match `/config` exactly and send a real weak ETag
  ([#781](https://github.com/rapaglaz/rapaglaz-portfolio/pull/781)); answer 400 for a malformed
  flag name ([#782](https://github.com/rapaglaz/rapaglaz-portfolio/pull/782)). Both Workers now
  have specs.

## Worker changes lost when a newer push cancelled the run (2026-10-18)

- **Problem:** a Worker change could stay undeployed while CI was green.
- **Cause:** `deploy-workers` compared each Worker folder with `github.event.before`. When a newer
  push cancelled a run before that job, or the run failed, the next run diffed only its own push.
  20 of the 100 Main Branch CI/CD runs before the fix had been cancelled by a newer push.
- **Fix:** compare with the head SHA of the last successful run on `main`, read with
  `gh run list` ([#784](https://github.com/rapaglaz/rapaglaz-portfolio/pull/784)).

## Lazy-loaded shell, eagerly bundled sections (2026-10-18)

- **Problem:** the router lazy-loaded the `Portfolio` shell, yet its chunk held only 2.61 kB; all
  sections were in `main`.
- **Cause:** the root component imported `Navbar` and `Footer` from the `features` barrel, which
  re-exports every section.
- **Fix:** import both from their own files and allow only the portfolio layer to import the
  barrel (dependency-cruiser rule `features-barrel-in-portfolio-only`). Initial bundle 503.94 kB →
  490.17 kB, `portfolio` chunk 2.61 kB → 17.04 kB
  ([#785](https://github.com/rapaglaz/rapaglaz-portfolio/pull/785)).

## Security headers documented but not served (2026-10-18)

- **Problem:** `docs/SECURITY.md` listed five headers set "at the Cloudflare edge (Workers)"; a
  curl of `https://rapaglaz.de/en` returned only `Strict-Transport-Security: max-age=15768000`.
- **Cause:** the Workers set only their own response headers, and no Cloudflare rule set the rest.
- **Fix:** a Cloudflare Response Header Transform Rule (`security-headers`) sets the other four; a
  second curl confirmed them, and the notes list the HSTS value that is served
  ([#786](https://github.com/rapaglaz/rapaglaz-portfolio/pull/786)).

## Config retried errors that cannot change (2026-10-18)

- **Problem:** `ConfigService` retried every failure three times back to back, including a 4xx and
  a response that failed the Valibot schema.
- **Cause:** `retry({ count: 3 })` ran after validation, with no condition and no delay.
- **Fix:** retry only network errors and 5xx on the HTTP request, 250 ms, 500 ms and 1 s apart
  ([#790](https://github.com/rapaglaz/rapaglaz-portfolio/pull/790)).

## /de served the English prerender (2026-10-18)

- **Problem:** `https://rapaglaz.de/de` returned `<html lang="en">`, English text and a canonical
  link to `/en` until the client switched the language.
- **Cause:** Cloudflare URL Rewrite Rules mapped `/en` and `/de` to `/index.html`, the prerender of
  `/`, although the build writes `en/index.html` and `de/index.html`.
- **Fix:** rewrite to `/en/index.html` and `/de/index.html`; curl then returned `lang="de"`, the
  `/de` canonical link and German text. The rules are documented in
  [Architecture](./ARCHITECTURE.md#ssg--hydration)
  ([#792](https://github.com/rapaglaz/rapaglaz-portfolio/pull/792)).

## i18n check that never failed on unused keys (2026-10-18)

- **Problem:** `i18n:find` reported 55 "extra" keys on every run and still passed.
- **Cause:** 53 keys are built at runtime, read as a whole object or passed as an input, which
  transloco-keys-manager cannot see; two keys were unused.
- **Fix:** list the runtime keys in `t(...)` comments next to their use, remove the two unused keys
  and set `emitErrorOnExtraKeys: true`
  ([#793](https://github.com/rapaglaz/rapaglaz-portfolio/pull/793)).

## Incremental hydration measured, not merged (2026-10-18)

- **Experiment:** wrap the five sections below the hero in `@defer (on idle; hydrate on viewport)`;
  Angular 22 enables incremental hydration by default.
- **Measured** against `main` (static build, local Chromium, `/en`): JS downloaded on load
  419.27 kB → 419.78 kB, after scrolling to the end 419.27 kB → 431.94 kB; main-thread script time
  until network idle with 4× CPU throttling (median of 7 runs, two series) 295 / 270 ms →
  183 / 179 ms; all scripts 486.99 kB → 499.73 kB against the 500 kB error budget. A section
  hydrated while on screen loses and regains its scroll-reveal `visible` class within 4 ms, so
  visible content replays its entrance animation.
- **Outcome:** not merged. The code and the measurements are on the
  [`perf/defer-portfolio-sections`](https://github.com/rapaglaz/rapaglaz-portfolio/tree/perf/defer-portfolio-sections)
  branch.

## Unit tests failed after the move to AnalogJS (2026-10-19)

- **Problem:** with the app moved to `apps/rapaglaz-portfolio` and its tests on `@nx/vitest` with
  AnalogJS, 23 tests in 5 files failed with `Cannot redefine property: location` (once
  `document`). They passed under `@angular/build:unit-test`.
- **Cause:** AnalogJS sets Vitest's `pool` to `vmThreads` unless the config names one. In a VM
  pool the global is jsdom's own `Window`, where `location` and `document` are not configurable;
  the old runner used the default `forks` pool, where they are configurable copies on the Node
  global.
- **Fix:** `pool: 'forks'` in `vite.config.mts`, without changing the tests. All 187 tests pass.
  Coverage numbers moved because the instrumentation changed, not the tests: branches went from
  92.56% of 457 to 86.69% of 233, and untested entry files now count.

## Paths that broke with the apps/ layout (2026-10-19)

- **Problem:** after the move, `deps:check` stopped with
  `Cannot read file apps/rapaglaz-portfolio/apps/rapaglaz-portfolio/tsconfig.json`, and the lcov
  report listed `src/app/...` paths that Sonar resolves from the repository root.
- **Cause:** dependency-cruiser passes the tsconfig path to TypeScript as given, and a relative
  path makes TypeScript resolve `extends` against it twice. Vitest writes lcov paths relative to
  its root, which is now the app folder.
- **Fix:** an absolute tsconfig path in `.dependency-cruiser.cjs`, and `projectRoot` for the lcov
  reporter set to the repository root. Both were caught before the commit.
