# Engineering notes

Problems from the history of this repository, oldest first, with the PRs that fixed them.

## Cached config error was never cleared (2026-07-05)

After one failed retry sequence, every later `getConfig()` call returned the same error until a
reload, because the failed observable stayed in `shareReplay({ refCount: false })`. The cache is now
dropped on error. [#500](https://github.com/rapaglaz/rapaglaz-portfolio/pull/500)

## E2E test ran the wrong path (2026-07-05)

"handles Turnstile verification error" never tested the error callback, because its
`addInitScript` mock was registered after the page had loaded. The mock is now installed before the
navigation, in a shared `mockTurnstileAPI(page, 'error')`.
[#503](https://github.com/rapaglaz/rapaglaz-portfolio/pull/503)

## Deploy used a new build, not the tested build (2026-07-05 to 2026-09-06)

The release workflow was a separate `workflow_run` with its own build job, so it did not deploy the
artifact that E2E had tested. It first checked out the validated `head_sha`
([#502](https://github.com/rapaglaz/rapaglaz-portfolio/pull/502)) and downloaded the tested artifact
([#509](https://github.com/rapaglaz/rapaglaz-portfolio/pull/509)). Today the deploy is a job in
`main-branch-ci-cd.yaml` that uses this artifact directly
([#663](https://github.com/rapaglaz/rapaglaz-portfolio/pull/663)).

## Initial bundle over the warning budget, twice (2026-07-05 and 2026-10-17)

In July the initial bundle had 539.5 kB against a warning budget of 500 kB, with no single part to
remove, so the budget went to 560 kB ([#512](https://github.com/rapaglaz/rapaglaz-portfolio/pull/512)).
In October it had 579.50 kB: Tailwind scanned Markdown and E2E files, and the CDK overlay, portal
and dialog were in the initial chunk. A Tailwind scan limited to `src/`
([#773](https://github.com/rapaglaz/rapaglaz-portfolio/pull/773)) and CDK packages loaded on demand
through local re-export modules ([#776](https://github.com/rapaglaz/rapaglaz-portfolio/pull/776))
brought it to 503.94 kB. A plain `import('@angular/cdk/overlay')` kept the complete CDK namespaces
and went over the error budget.

## A jsdom minor release broke unit tests (2026-09-23 to 2026-10-12)

jsdom 30.1.0 ([#708](https://github.com/rapaglaz/rapaglaz-portfolio/pull/708)) moved its internals
to a WeakMap, while the `URL.createObjectURL` shim of Vitest 4.1.11 still read
`blob[implSymbol]._buffer`, so a download test failed on `main`. jsdom stayed pinned to 30.0.1 and
held in Renovate ([#712](https://github.com/rapaglaz/rapaglaz-portfolio/pull/712)) until Vitest
5.0.2 ([#730](https://github.com/rapaglaz/rapaglaz-portfolio/pull/730)). The pin is at 30.1.2 since
[#766](https://github.com/rapaglaz/rapaglaz-portfolio/pull/766).

## Playwright image and package version out of sync, three times (2026-07-05 to 2026-10-12)

The `mcr.microsoft.com/playwright` image in CI and `@playwright/test` must have the same version.
They went apart three times: the Renovate manager still watched a removed workflow
([#501](https://github.com/rapaglaz/rapaglaz-portfolio/pull/501)), a package update was merged
without E2E because the job was skipped for `renovate/*` PRs
([#713](https://github.com/rapaglaz/rapaglaz-portfolio/pull/713), gate fixed in
[#730](https://github.com/rapaglaz/rapaglaz-portfolio/pull/730)), and `minimumReleaseAge` removed
the image, which has no release timestamp, from the Renovate group
([#768](https://github.com/rapaglaz/rapaglaz-portfolio/pull/768)). Today the E2E jobs run on
`ubuntu-latest` and install the browsers themselves, see [CI strategy](./CI_STRATEGY.md).

## zizmor findings in the workflows (2026-10-08)

zizmor ran in report-only mode, because the build action put `${{ inputs.base-href }}` directly
into a shell script and every `actions/checkout` kept its credentials. The input now goes through
`env`, every checkout sets `persist-credentials: false`, `.github/zizmor.yml` holds one disabled rule
and one ignored line with reasons, and both report-only switches are gone.
[#754](https://github.com/rapaglaz/rapaglaz-portfolio/pull/754)

## Layer rules were not enforced (2026-10-10)

The first dependency-cruiser run, with every rule at `warn`, found 11 warnings in 81 modules, among
them a cycle from the missing translation handler through the services barrel. After a direct
import of the logger and five narrow exceptions (removed with the move to libs, #807 to #812), all
boundary and cycle rules are `error`, and `deps:check` runs in the lint job.
[#756](https://github.com/rapaglaz/rapaglaz-portfolio/pull/756)

## Origin and token checks in the Workers (2026-10-17 to 2026-10-18)

The CV download Worker skipped `siteverify` for the Cloudflare test token when Origin or Referer
contained `localhost`, which the client controls. `portfolio-settings` matched `localhost` as a
substring, and `feature-flag` threw on a malformed escape such as `%E0%A4%A`. Now only
`ALLOW_TEST_TOKEN` on a development Worker skips `siteverify`, local origins are compared by
hostname, and a malformed flag name gets 400. I found it while adding the Worker sources to this
repo, and the specs reproduce each case
([#777](https://github.com/rapaglaz/rapaglaz-portfolio/pull/777),
[#781](https://github.com/rapaglaz/rapaglaz-portfolio/pull/781),
[#782](https://github.com/rapaglaz/rapaglaz-portfolio/pull/782)).

## Lost Worker changes when a newer push canceled the run (2026-10-18)

`deploy-workers` compared each Worker folder with `github.event.before`. When a newer push canceled
a run, as in 20 of the last 100 runs, the next run saw only its own push, so a Worker change could
stay undeployed with green CI. The job now compares with the head SHA of the last successful run on
`main`. [#784](https://github.com/rapaglaz/rapaglaz-portfolio/pull/784)

## Lazy-loaded shell, eagerly bundled sections (2026-10-18)

The router lazy-loaded the `Portfolio` shell, but all sections were in `main`, because the root
component imported `Navbar` and `Footer` from a barrel that re-exported every section. Direct
imports and a dependency-cruiser rule for the barrel moved the sections out of the initial bundle,
from 503.94 kB to 490.17 kB. [#785](https://github.com/rapaglaz/rapaglaz-portfolio/pull/785)

## Security headers documented but not served (2026-10-18)

`docs/SECURITY.md` listed five headers, but `curl` on `/en` showed only HSTS, because the Workers set
headers only on their own responses. A Cloudflare Response Header Transform Rule now sets the other
four, and the docs show the HSTS value that the server sends.
[#786](https://github.com/rapaglaz/rapaglaz-portfolio/pull/786)

## /de served the English prerender (2026-10-18)

`/de` returned `lang="en"`, English text and a canonical link to `/en` until the client switched the
language, because the Cloudflare rewrite rules pointed both locale routes to the prerender of `/`.
They now point to `/en/index.html` and `/de/index.html`, see
[Architecture](./ARCHITECTURE.md#ssg-and-hydration).
[#792](https://github.com/rapaglaz/rapaglaz-portfolio/pull/792)

## Incremental hydration: measured, not merged (2026-10-18)

`@defer (on idle; hydrate on viewport)` for the five sections below the hero cut the main-thread
script time with 4× CPU throttling from about 280 ms to 180 ms. It also raised all scripts from
486.99 kB to 499.73 kB, just below the error budget of 500 kB, and a section that hydrated on screen
played its entrance animation again. Not merged; the code and the measurements are on the
[`perf/defer-portfolio-sections`](https://github.com/rapaglaz/rapaglaz-portfolio/tree/perf/defer-portfolio-sections)
branch.

## Unit tests failed after the move to AnalogJS (2026-10-19)

After the move to `@nx/vitest` with AnalogJS, 23 tests failed with
`Cannot redefine property: location`. AnalogJS uses the `vmThreads` pool when the config names
none, and there the global object is the jsdom `Window`, where `location` cannot be redefined.
`pool: 'forks'` (today in `vitest.angular.mts`) fixed it without changes to the tests. The coverage
numbers changed only because the instrumentation changed.
