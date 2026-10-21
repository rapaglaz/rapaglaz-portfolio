# Cloudflare Workers

The three Workers behind `rapaglaz.de`. Each folder is named after its Worker in Cloudflare, and its
`wrangler.jsonc` is the source of truth for that Worker.

| Worker                                        | Endpoint                       | Bindings and settings                                                                                                                                                       |
| --------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`cv-download`](./cv-download/)               | `GET /download?file=cv/<name>` | R2 `PORTFOLIO_FILES` (`portfolio-files`), secret `TURNSTILE_SECRET`, rate limiter `DOWNLOAD_RATE_LIMITER` (10 per 60 s per IP); optional and not set: var `ALLOWED_ORIGINS` |
| [`feature-flag`](./feature-flag/)             | `GET /feature-flag/<name>`     | KV `KV` (namespace `PORTFOLIO_FLAGS`), values `true` or `false`                                                                                                             |
| [`portfolio-settings`](./portfolio-settings/) | `GET` or `HEAD /config`        | none; the Turnstile site key is public by design                                                                                                                            |

The frontend validates `/config` and `/feature-flag` with Valibot and reads `/download` as a blob.
The download flow is in [Security notes](../../docs/SECURITY.md).

## Configuration

- Routes are managed in the Cloudflare dashboard. The configs have no route keys and set
  `workers_dev` to `false`, so `wrangler deploy` leaves the routes alone.
- Bindings and vars are in `wrangler.jsonc`, and a deploy replaces what the dashboard has.
- Secrets are set with `wrangler secret put` and a deploy does not change them. `cv-download` marks
  `TURNSTILE_SECRET` as required, so its deploy fails without it.

## Nx targets

Each Worker is an Nx project with `test`, `check` (`wrangler deploy --dry-run`, no login needed),
`deploy` and `lint`. `check` and `deploy` are defined once in `nx.json`. The lint config
[`eslint.config.mjs`](./eslint.config.mjs) does not extend the root config. It shares only the
boundary rule.

## Deploy from CI

`deploy-workers` in `.github/workflows/main-branch-ci-cd.yaml` deploys from `main` after lint,
tests, the build and E2E pass. It deploys only the Workers that `nx affected` reports since the last
green run on `main`, so the changes of a canceled or failed run are not lost. It uses the secrets
`CLOUDFLARE_API_TOKEN` (Edit Cloudflare Workers) and `CLOUDFLARE_ACCOUNT_ID` of the `production`
environment.

Each deploy tags the Worker version with the short commit SHA and subject, so
`wrangler deployments status` shows which commit is live.

## First deploy of a Worker

`wrangler deploy` replaces the bindings and vars of a Worker with those in its `wrangler.jsonc`. It
does not merge them with the dashboard. On 2026-10-17 a deploy of `feature-flag` from a config
without bindings lost its KV binding, and the endpoint returned 500 until a rollback.

Before the first deploy:

1. Add every binding and var the Worker uses to its `wrangler.jsonc`.
   `wrangler versions view <ID> --name <worker>` shows them for the active version, and
   `wrangler deployments status` gives the ID.
2. Run `pnpm run test:workers`. It fails when a config lacks a binding the code needs, when the code
   reads an `env` name the test does not know, or when `vars` sets `ALLOW_TEST_TOKEN`.
3. Run `pnpm run workers:check` and compare the bindings it lists with the active version.
4. Deploy with `pnpm nx deploy <worker>` and check that the output lists the same bindings. If
   something breaks, `wrangler rollback` in the Worker folder restores the previous version. Use the
   wrangler version from `nx.json`, the same one that the deploy target runs.

All three Workers went through these steps before `DEPLOY_WORKERS` was set to `true` on 2026-10-17.
A new Worker goes through them before its first deploy from CI.

## Stopping deploys

The repository variable `DEPLOY_WORKERS` is a switch to stop deploys. While it is anything but
`true`, `deploy-workers` is skipped, for example during an incident or while a binding is changed in
the dashboard. A run with the job skipped is still green and becomes the base for the next
comparison. So Worker changes merged while the switch is off are not deployed when it is turned on
again. Deploy them manually with `pnpm nx deploy <worker>`.
