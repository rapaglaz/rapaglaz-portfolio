# Engineering notes

Problems from this repo's history, oldest first, with the PRs that fixed them.

## Cached config error never cleared (2026-07-05)

- **Problem:** after one failed retry sequence, every later `getConfig()` call replayed the error
  without a request, until the page was reloaded.
- **Cause:** the failed observable stayed cached in `shareReplay({ refCount: false })`.
- **Fix:** drop the cached observable on error, so the next call fetches again.
  [#500](https://github.com/rapaglaz/rapaglaz-portfolio/pull/500)

## E2E test ran the wrong path (2026-07-05)

- **Problem:** "handles Turnstile verification error" ran the script-load-failure path, the same as
  the next test. The error callback was never tested.
- **Cause:** its `addInitScript` mock was registered after `visitPortfolio` had loaded the page, so
  the mock never ran.
- **Fix:** install the mock before navigation, in a shared `mockTurnstileAPI(page, 'error')`.
  [#503](https://github.com/rapaglaz/rapaglaz-portfolio/pull/503)

## Deploy shipped a rebuild, not the tested build (2026-07-05 to 2026-09-06)

- **Problem:** the release workflow built whatever `main` pointed at when it started. That was not
  the artifact that E2E had tested.
- **Cause:** deploy was a separate `workflow_run` workflow with its own build job.
- **Fix:** check out the validated `head_sha`
  ([#502](https://github.com/rapaglaz/rapaglaz-portfolio/pull/502)), then download
  `build-artifact-main` from the triggering run instead of building again
  ([#509](https://github.com/rapaglaz/rapaglaz-portfolio/pull/509)). Later the deploy became a job
  in `main-branch-ci-cd.yaml` that uses the artifact directly
  ([#663](https://github.com/rapaglaz/rapaglaz-portfolio/pull/663)).

## Initial bundle over the warning budget, twice (2026-07-05 and 2026-10-17)

- **Problem:** the build warned on every run. In July the initial bundle was 539.5 kB against a
  warning budget of 500 kB. In October it was 579.50 kB against 560 kB.
- **Cause:** in July, `@angular/core` (153 kB), the router, the CDK and common code, with no simple
  cut. In October, Tailwind scanned Markdown and E2E files and made DaisyUI components that no
  template uses, and the CDK overlay, portal and dialog were in the initial chunk, although only a
  toast or the CV verification needs them.
- **Fix:** in July the warning budget went to 560 kB
  ([#512](https://github.com/rapaglaz/rapaglaz-portfolio/pull/512)). In October Tailwind was limited
  to `src/`, which reduced the stylesheet from 98.50 kB to 86.28 kB
  ([#773](https://github.com/rapaglaz/rapaglaz-portfolio/pull/773)), and the CDK packages load on
  demand through local re-export modules: initial 503.94 kB
  ([#776](https://github.com/rapaglaz/rapaglaz-portfolio/pull/776)). A first attempt with
  `import('@angular/cdk/overlay')` kept the whole CDK namespaces and raised all scripts to
  540.43 kB, over the error budget of 500 kB.

## A jsdom minor release broke unit tests (2026-09-23 to 2026-10-12)

- **Problem:** after the jsdom 30.1.0 bump
  ([#708](https://github.com/rapaglaz/rapaglaz-portfolio/pull/708)), the `CvDownloadService` test
  failed with `Cannot read properties of undefined (reading '_buffer')`, and main CI broke.
- **Cause:** jsdom 30.1.0 moved its internals from a symbol-keyed property to a WeakMap. The
  `URL.createObjectURL` shim in Vitest 4.1.11 read `blob[implSymbol]._buffer` directly. Vitest 5.0.1
  had the same shim, and the `vitest: ^4.0.8` peer range of `@angular/build` blocked it anyway.
- **Fix:** pin jsdom to 30.0.1 and hold it below 30.1.0 in Renovate
  ([#712](https://github.com/rapaglaz/rapaglaz-portfolio/pull/712)). Vitest went to 5.0.2 and the
  hold was removed in [#730](https://github.com/rapaglaz/rapaglaz-portfolio/pull/730). The jsdom
  pin moved to 30.1.2 in [#766](https://github.com/rapaglaz/rapaglaz-portfolio/pull/766).

## Playwright image and package drifted apart, three times (2026-07-05 to 2026-10-12)

- **Problem:** the `mcr.microsoft.com/playwright` image in CI and `@playwright/test` must have the
  same version. They did not, for three different reasons.
- **Cause:**
  - The Renovate custom manager still watched `e2e.yaml`, removed in #437, so the image stopped
    updating ([#501](https://github.com/rapaglaz/rapaglaz-portfolio/pull/501)).
  - #711 bumped `@playwright/test` to 1.62.0 while the workflows stayed on `v1.61.1-noble`, and
    `browserType.launch` failed with "Executable doesn't exist". Nobody noticed, because `e2e-tests`
    was skipped for `renovate/*` PRs ([#713](https://github.com/rapaglaz/rapaglaz-portfolio/pull/713)).
  - The image has no release timestamp, so `minimumReleaseAge` with `internalChecksFilter: strict`
    removed it from the Playwright group, so the PRs contained only the npm package
    ([#768](https://github.com/rapaglaz/rapaglaz-portfolio/pull/768)).
- **Fix:** widen the manager to all workflow files (#501), move the image to `v1.62.0-noble` (#713),
  run unit and E2E tests on every PR and fail the gate on skipped jobs
  ([#730](https://github.com/rapaglaz/rapaglaz-portfolio/pull/730)), and keep the image in the same
  Renovate PR as the package (#768).

## zizmor findings in the workflows (2026-10-08)

- **Problem:** zizmor reported findings, so its CI job and pre-commit hook ran report-only
  (`continue-on-error: true`, `--no-exit-codes`).
- **Cause:** the build action put `${{ inputs.base-href }}` directly into a shell script, and every
  `actions/checkout` kept its credentials.
- **Fix:** pass the input through `env`, set `persist-credentials: false` on every checkout, add
  `.github/zizmor.yml` (one disabled rule and one ignored line, each with a reason) and remove both
  report-only switches. [#754](https://github.com/rapaglaz/rapaglaz-portfolio/pull/754)

## Layer rules were not enforced (2026-10-10)

- **Problem:** the first dependency-cruiser run, with every rule at `warn`, reported 11 warnings in
  81 modules, including one cycle.
- **Cause:** `utils/i18n/transloco-missing-handler.ts` imported the services barrel, which led back
  through `cv-download.service.ts` to `utils/i18n`.
- **Fix:** import the logger file directly, allow five narrow file-level exceptions (removed with
  the move to libs, #807 to #812), set all boundary and cycle rules to `error` and run `deps:check`
  in the lint job. Two temporary probes, a cross-feature import and a cycle, gave exit code 1.
  [#756](https://github.com/rapaglaz/rapaglaz-portfolio/pull/756)

## Origin and token checks in the Workers (2026-10-17 to 2026-10-18)

- **Problem:** the CV download Worker skipped `siteverify` for the public test token of Cloudflare
  when Origin or Referer contained `localhost`. `portfolio-settings` matched `localhost` as a
  substring, so `https://evil-localhost.example` got an `Access-Control-Allow-Origin` header.
  `feature-flag` threw an unhandled `URIError` on a malformed escape such as `%E0%A4%A`.
- **Cause:** local dev calls the production Worker with the test site key, so the bypass depended on
  headers that the client controls. The other two Workers had no behavior tests.
- **Fix:** only `ALLOW_TEST_TOKEN` on a development Worker skips `siteverify`, and local origins are
  compared by hostname. I found it while adding the Worker sources to this repo, and
  `apps/workers/cv-download/index.spec.js` reproduces each case
  ([#777](https://github.com/rapaglaz/rapaglaz-portfolio/pull/777)). The other two Workers got
  their fixes and specs in [#781](https://github.com/rapaglaz/rapaglaz-portfolio/pull/781)
  (`portfolio-settings`) and [#782](https://github.com/rapaglaz/rapaglaz-portfolio/pull/782)
  (`feature-flag`, answers 400 for a malformed flag name).

## Worker changes lost when a newer push canceled the run (2026-10-18)

- **Problem:** a Worker change could remain undeployed while CI was green.
- **Cause:** `deploy-workers` compared each Worker folder with `github.event.before`. If a newer
  push canceled a run before that job, or the run failed, the next run compared only its own push.
  Before the fix, 20 of the last 100 Main Branch CI/CD runs had been canceled by a newer push.
- **Fix:** compare with the head SHA of the last successful run on `main`, read with `gh run list`
  ([#784](https://github.com/rapaglaz/rapaglaz-portfolio/pull/784)).

## Lazy-loaded shell, eagerly bundled sections (2026-10-18)

- **Problem:** the router lazy-loaded the `Portfolio` shell, but its chunk was only 2.61 kB. All
  sections were in `main`.
- **Cause:** the root component imported `Navbar` and `Footer` from the `features` barrel, which
  re-exports every section.
- **Fix:** import both from their own files and let only the portfolio layer import the barrel
  (dependency-cruiser rule `features-barrel-in-portfolio-only`, now `portfolio-ui-in-feature-only`).
  The initial bundle went from 503.94 kB to 490.17 kB and the `portfolio` chunk from 2.61 kB to
  17.04 kB ([#785](https://github.com/rapaglaz/rapaglaz-portfolio/pull/785)).

## Security headers documented but not served (2026-10-18)

- **Problem:** `docs/SECURITY.md` listed five headers set "at the Cloudflare edge (Workers)", but
  `curl` on `https://rapaglaz.de/en` returned only `Strict-Transport-Security: max-age=15768000`.
- **Cause:** the Workers set only their own response headers, and no Cloudflare rule set the others.
- **Fix:** a Cloudflare Response Header Transform Rule (`security-headers`) sets the other four. A
  second `curl` confirmed it, and the docs now show the HSTS value that is really served
  ([#786](https://github.com/rapaglaz/rapaglaz-portfolio/pull/786)).

## /de served the English prerender (2026-10-18)

- **Problem:** `https://rapaglaz.de/de` returned `<html lang="en">`, English text and a canonical
  link to `/en`, until the client switched the language.
- **Cause:** Cloudflare URL Rewrite Rules mapped `/en` and `/de` to `/index.html`, the prerender of
  `/`, but the build writes `en/index.html` and `de/index.html`.
- **Fix:** rewrite to `/en/index.html` and `/de/index.html`. `curl` then returned `lang="de"`, the
  `/de` canonical link and German text. The rules are in
  [Architecture](./ARCHITECTURE.md#ssg-and-hydration)
  ([#792](https://github.com/rapaglaz/rapaglaz-portfolio/pull/792)).

## Incremental hydration: measured, not merged (2026-10-18)

- **Experiment:** wrap the five sections below the hero in `@defer (on idle; hydrate on viewport)`.
  Angular 22 enables incremental hydration by default.
- **Measured** against `main` (static build, local Chromium, `/en`):
  - JS downloaded on load: from 419.27 kB to 419.78 kB. After scrolling to the end: from 419.27 kB
    to 431.94 kB.
  - Main-thread script time until network idle, with 4× CPU throttling, median of 7 runs in two
    series: from 295 / 270 ms to 183 / 179 ms.
  - All scripts: from 486.99 kB to 499.73 kB, against the error budget of 500 kB.
  - A section that hydrated on screen lost and regained its scroll-reveal `visible` class within
    4 ms, so visible content played its entrance animation again.
- **Outcome:** not merged. The code and the measurements are on the
  [`perf/defer-portfolio-sections`](https://github.com/rapaglaz/rapaglaz-portfolio/tree/perf/defer-portfolio-sections)
  branch.

## Unit tests failed after the move to AnalogJS (2026-10-19)

- **Problem:** after the app moved to `apps/rapaglaz-portfolio` and its tests to `@nx/vitest` with
  AnalogJS, 23 tests in 5 files failed with `Cannot redefine property: location` (once `document`).
  They had passed under `@angular/build:unit-test`.
- **Cause:** AnalogJS sets the Vitest `pool` to `vmThreads` unless the config names one. In a VM pool
  the global is the `Window` of jsdom, where `location` and `document` cannot be redefined. The old
  runner used the default `forks` pool, where they can.
- **Fix:** `pool: 'forks'` in `vite.config.mts`, with no change to the tests. The coverage numbers
  changed because the instrumentation changed, not the tests: branches went from 92.56% of 457 to
  86.69% of 233, and untested entry files now count.
