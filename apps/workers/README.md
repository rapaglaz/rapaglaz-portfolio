# Cloudflare Workers

Sources of the three Workers behind `rapaglaz.de`. Each folder name matches the Worker name in
Cloudflare, and its `wrangler.jsonc` is the source of truth for that Worker.

| Worker                                        | Endpoint                       | Bindings and settings                                                                                                                                                              |
| --------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`cv-download`](./cv-download/)               | `GET /download?file=cv/<name>` | R2 `PORTFOLIO_FILES` (`portfolio-files`), secret `TURNSTILE_SECRET`, rate limiter `DOWNLOAD_RATE_LIMITER` (10 per 60 s per IP); optional and not configured: var `ALLOWED_ORIGINS` |
| [`feature-flag`](./feature-flag/)             | `GET /feature-flag/<name>`     | KV `KV` (namespace `PORTFOLIO_FLAGS`), values `true` or `false`                                                                                                                    |
| [`portfolio-settings`](./portfolio-settings/) | `GET` or `HEAD /config`        | none; the Turnstile site key is public by design                                                                                                                                   |

The frontend validates `/config` and `/feature-flag` responses with Valibot and reads `/download`
as a blob. See [Security notes](../../docs/SECURITY.md) for the download flow.

## Configuration

- Routes stay in the Cloudflare dashboard. The configs have no route keys and set `workers_dev` to
  `false`, so `wrangler deploy` leaves the routes unchanged.
- Bindings and vars live in `wrangler.jsonc`; a deploy replaces what the dashboard has.
- Secrets are set with `wrangler secret put` and survive deploys. `cv-download` declares
  `TURNSTILE_SECRET` as required, so its deploy fails while the secret is missing.
- `pnpm run workers:check` bundles each Worker with `wrangler deploy --dry-run`, without a Cloudflare
  login. CI runs it in the test job.

## Deploy

Each Worker folder is an Nx project with the tag `type:worker` and the targets `test`, `check`
(`wrangler deploy --dry-run`), `deploy` (`wrangler deploy`) and `lint`. `check` and `deploy` are
defined once in `nx.json`, and so are the lint cache inputs (the `workerLint` named input). The lint
rules live in [`eslint.config.mjs`](./eslint.config.mjs) in this folder, separate from the root config;
it adds only the shared Nx boundary rule from
[`eslint.module-boundaries.mjs`](../../eslint.module-boundaries.mjs).

`deploy-workers` in `.github/workflows/main-branch-ci-cd.yaml` deploys from `main` after lint and
tests pass, and only the Workers that `nx affected` reports since the last green run on `main`, so a
run that was cancelled or failed does not lose its changes. The job uses the secrets
`CLOUDFLARE_API_TOKEN` (Edit Cloudflare Workers) and `CLOUDFLARE_ACCOUNT_ID`.

Every deploy tags the Worker version with the short commit SHA and the commit subject (`--tag`,
`--message`), so `wrangler deployments status` shows which commit is live. Author and Source come
from Cloudflare and cannot be set from Wrangler.

### First deploy from this repo

`wrangler deploy` replaces the bindings and vars of a Worker with the ones in its `wrangler.jsonc`;
it does not merge them with the dashboard. On 2026-10-17 a deploy of `feature-flag` from a config
without bindings dropped its KV binding, and the endpoint returned 500 until a rollback.

Before deploying a Worker from this repo:

1. Add every binding and var it uses to its `wrangler.jsonc`. `wrangler versions view <ID> --name
<worker>` shows them for the active version (`wrangler deployments status` gives the ID).
2. Run `pnpm run test:workers`: it fails when a config lacks a binding the code needs, when the
   code reads an `env` name the test does not know, or when `vars` sets `ALLOW_TEST_TOKEN`.
3. Run `pnpm run workers:check` and compare the bindings it lists with the active version.
4. Deploy with `pnpm nx deploy <worker>` and check that the deploy output lists the same bindings.
   If something breaks, `npx wrangler@4.151.1 rollback` in the Worker folder returns to the previous
   version.

All three Workers went through these steps before `DEPLOY_WORKERS` was set to `true` on 2026-10-17;
a new Worker goes through them before its first deploy from CI.

### Stopping deploys

The repository variable `DEPLOY_WORKERS` is a kill switch. While it is anything but `true`,
`deploy-workers` is skipped, for example during an incident or while a binding is changed in the
dashboard. A run with the job skipped is still green and becomes the base of the next comparison, so
Worker changes merged while the switch is off are not deployed when it is turned back on. Deploy
them by hand with `pnpm nx deploy <worker>`.
