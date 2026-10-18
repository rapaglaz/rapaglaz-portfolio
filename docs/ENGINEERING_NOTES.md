# Engineering notes

Problems from this repo's history, oldest first, with the PRs that fixed them.

## Cached config error never cleared (2026-07-05)

- **Problem:** after one failed retry sequence, every later `getConfig()` call replayed the error
  without an HTTP request until a full page reload.
- **Cause:** the errored observable stayed cached in `shareReplay({ refCount: false })`.
- **Fix:** reset the cached observable on error so the next call fetches again, with a spec for
  it. [#500](https://github.com/rapaglaz/rapaglaz-portfolio/pull/500)

## E2E test passed through the wrong path (2026-07-05)

- **Problem:** "handles Turnstile verification error" ran the script-load-failure path, so it was
  a duplicate of the next test and the error callback was never exercised.
- **Cause:** its `addInitScript` mock was registered after `visitPortfolio` had loaded the page,
  so the mock never ran.
- **Fix:** install the mock before navigation through a shared `mockTurnstileAPI(page, 'error')`
  outcome instead of an inline copy. [#503](https://github.com/rapaglaz/rapaglaz-portfolio/pull/503)

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

## Bundle budget warned on every build (2026-07-05)

- **Problem:** every production build warned: initial was 539.5 kB raw against a 500 kB warning
  budget.
- **Cause:** measured with `stats.json`: 153 kB `@angular/core`, 66 kB router, 66 kB CDK (about
  39 kB of it overlay + portal), 35 kB common. No low-complexity cut got back under 500 kB.
- **Fix:** raise the warning budget to 560 kB and keep the 700 kB error.
  [#512](https://github.com/rapaglaz/rapaglaz-portfolio/pull/512)

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

## Workflow findings from zizmor (2026-10-08)

- **Problem:** zizmor reported findings in the workflows, so its CI job and pre-commit hook ran
  report-only (`continue-on-error: true`, `--no-exit-codes`).
- **Cause:** the build action expanded `${{ inputs.base-href }}` directly inside the shell
  script, and every `actions/checkout` persisted credentials.
- **Fix:** pass the input through `env`, set `persist-credentials: false` on all checkouts, add
  `.github/zizmor.yml` with one disabled rule and one ignored line, each with a reason, and drop
  both report-only switches. [#754](https://github.com/rapaglaz/rapaglaz-portfolio/pull/754)

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
