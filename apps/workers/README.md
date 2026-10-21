# Cloudflare Workers

The three Workers behind `rapaglaz.de`. Each folder has the name of its Worker in Cloudflare, and
its `wrangler.jsonc` is the source of truth for this Worker.

| Worker                                        | Endpoint                       | Bindings and settings                                                                                                                                                       |
| --------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`cv-download`](./cv-download/)               | `GET /download?file=cv/<name>` | R2 `PORTFOLIO_FILES` (`portfolio-files`), secret `TURNSTILE_SECRET`, rate limiter `DOWNLOAD_RATE_LIMITER` (10 per 60 s per IP); optional and not set: var `ALLOWED_ORIGINS` |
| [`feature-flag`](./feature-flag/)             | `GET /feature-flag/<name>`     | KV `KV` (namespace `PORTFOLIO_FLAGS`), values `true` or `false`                                                                                                             |
| [`portfolio-settings`](./portfolio-settings/) | `GET` or `HEAD /config`        | none; the Turnstile site key is public by design                                                                                                                            |

The frontend validates `/config` and `/feature-flag` with Valibot and reads `/download` as a blob.
The download flow is described in [Security notes](../../docs/SECURITY.md).

## Configuration

- The routes are managed in the Cloudflare dashboard. The configs have no route keys and set
  `workers_dev` to `false`, so `wrangler deploy` does not change the routes.
- Bindings and vars are in `wrangler.jsonc`, and a deploy replaces the values in the dashboard.
- Secrets are set with `wrangler secret put`, and a deploy does not change them. `cv-download`
  marks `TURNSTILE_SECRET` as required, so its deploy fails without this secret.

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

All three Workers went through these steps before `DEPLOY_WORKERS` was set to `true` on
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
