# Cloudflare Workers

The Workers behind `rapaglaz.de`. Each folder has the name of its Worker in Cloudflare, and
its `wrangler.jsonc` is the source of truth for this Worker.

| Worker                                        | Endpoint                       | Bindings and settings                                                                                                                                                       |
| --------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`cv-download`](./cv-download/)               | `GET /download?file=cv/<name>` | R2 `PORTFOLIO_FILES` (`portfolio-files`), secret `TURNSTILE_SECRET`, rate limiter `DOWNLOAD_RATE_LIMITER` (10 per 60 s per IP); optional and not set: var `ALLOWED_ORIGINS` |
| [`feature-flag`](./feature-flag/)             | `GET /feature-flag/<name>`     | KV `KV` (namespace `PORTFOLIO_FLAGS`), values `true` or `false`                                                                                                             |
| [`portfolio-settings`](./portfolio-settings/) | `GET` or `HEAD /config`        | none; the Turnstile site key is public by design                                                                                                                            |
| [`site-fallback`](./site-fallback/)           | `GET` or `HEAD /en*`, `/de*`   | none; routes are added by hand, see [Offline page](#offline-page)                                                                                                           |

## Offline page

The portfolio pages come from a separate web host, not from Cloudflare. When this host is down,
Cloudflare answers with its own error page (for example 521). `site-fallback` replaces such an error
with a page of the portfolio, so that a visitor sees a clear message instead of a technical one.

- The Worker passes every request to the origin. For a `GET` or `HEAD` request, an answer with
  status 500 or higher (or a failed request) becomes the page in
  [`site-fallback/offline.html`](./site-fallback/offline.html), with status 503, `Retry-After` and
  `Cache-Control: no-store`, so that crawlers and caches do not keep it. Other answers and other
  methods are not changed.
- The page has only inline CSS and no script, because nothing else is available during the outage.
  The language follows the path (`/de`, otherwise English). The page reloads itself every minute, so
  the real page appears as soon as the origin answers again.
- The texts are in [`index.ts`](./site-fallback/index.ts) and fill the `[[tokens]]` of the HTML file.
  Transloco is not available in a Worker, so these two languages are kept by hand.
- Routes are added in the dashboard (Workers Routes), only for the pages and not for the assets, so
  that the daily request limit of the Free plan is not used for every image or script:
  `rapaglaz.de/en*`, `rapaglaz.de/de*`, `www.rapaglaz.de/en*`, `www.rapaglaz.de/de*`. The routes of the
  other Workers (`/config`, `/feature-flag/*`, `/download`) are more specific and stay unchanged.
  Until the routes exist, a deploy of this Worker has no effect on the site.
- Preview: open `offline.html` in a browser; the tokens stay visible there. The specs check the
  finished page for both languages.

The frontend validates `/config` and `/feature-flag` with Valibot and reads `/download` as a blob.
The download flow is described in [Security notes](../../docs/SECURITY.md).

## Configuration

- The routes are managed in the Cloudflare dashboard. The configs have no route keys and set
  `workers_dev` to `false`, so `wrangler deploy` does not change the routes.
- Bindings and vars are in `wrangler.jsonc`, and a deploy replaces the values in the dashboard.
- Secrets are set with `wrangler secret put`, and a deploy does not change them. `cv-download`
  marks `TURNSTILE_SECRET` as required, so its deploy fails without this secret.

## Nx targets

Each Worker is an Nx project with `test`, `typecheck`, `check` (`wrangler deploy --dry-run`, no
login needed), `deploy` and `lint`. `check` and `deploy` are defined once in `nx.json`. The lint
config [`eslint.config.mjs`](./eslint.config.mjs) does not extend the root config. It uses the same
TypeScript presets and shares the boundary rule.

## TypeScript

The Workers are written in TypeScript. Wrangler bundles `index.ts` itself, so the Workers need no
separate build step.

[`tsconfig.base.json`](./tsconfig.base.json) replaces the browser types of the root config with the
runtime types from `@cloudflare/workers-types` (`lib: es2022`, no DOM), so that `Request`,
`Response` and the bindings have the types of the Workers runtime. The package describes the latest
runtime, not the `compatibility_date` of a Worker. The `Env` type in each `index.ts` is written by
hand from the binding types of the package (`KVNamespace`, `R2Bucket`, `RateLimit`). Cloudflare
recommends `wrangler types` instead, but it writes about 600 kB of runtime types per Worker into the
repository.

The code can read only the names that `Env` lists. The wrangler-config spec checks that the spec
knows every `env` name that the code reads, and that `wrangler.jsonc` declares the bindings that the
Worker needs. `pnpm run typecheck` checks the sources and the specs.

## Deploy from CI

`deploy-workers` in `.github/workflows/main-branch-ci-cd.yaml` deploys from `main` after lint,
tests, the build and E2E pass. It deploys only the Workers that `nx affected` reports since the last
green run on `main`, so the changes of a canceled or failed run are not lost. It uses the secrets
`CLOUDFLARE_API_TOKEN` (Edit Cloudflare Workers) and `CLOUDFLARE_ACCOUNT_ID` of the `production`
environment.

Each deploy tags the Worker version with the short commit SHA and the commit subject, so
`wrangler deployments status` shows which commit is live.

## First deploy of a Worker

`wrangler deploy` replaces the bindings and vars of a Worker with the values in its
`wrangler.jsonc`. It does not merge them with the dashboard. On 2026-10-17, a deploy of
`feature-flag` from a config without bindings removed its KV binding, and the endpoint returned 500
until a rollback.

Steps before the first deploy:

1. Add every binding and var that the Worker uses to its `wrangler.jsonc`.
   `wrangler versions view <ID> --name <worker>` shows them for the active version, and
   `wrangler deployments status` shows the ID.
2. Run `pnpm run test:workers`. It fails when a config does not have a binding that the code needs,
   when the code reads an `env` name that the test does not know, or when `vars` sets
   `ALLOW_TEST_TOKEN`.
3. Run `pnpm run workers:check` and compare the bindings in its output with the active version.
4. Deploy with `pnpm nx deploy <worker>` and check that the output lists the same bindings. After a
   failed deploy, `wrangler rollback` in the Worker folder restores the previous version. Use the
   wrangler version from `nx.json`, the same version that the deploy target runs.

`site-fallback` has no bindings, so steps 1 and 3 have nothing to compare. The other three Workers went through these steps before `DEPLOY_WORKERS` was set to `true` on
2026-10-17. A new Worker goes through them before its first deploy from CI.

## Stopping deploys

The repository variable `DEPLOY_WORKERS` stops the Worker deploys. While it has any value other
than `true`, `deploy-workers` is skipped, for example during an incident or during a change of a
binding in the dashboard. A run with the skipped job is still green and becomes the base for the
next comparison. For this reason, Worker changes merged while the switch is off are not deployed
when it is on again. Deploy them manually:

```bash
pnpm nx deploy <worker>
```
