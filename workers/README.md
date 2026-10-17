# Cloudflare Workers

Sources of the three Workers behind `rapaglaz.de`. Each folder name matches the Worker name in
Cloudflare, and its `wrangler.jsonc` is the source of truth for that Worker.

| Worker                                        | Endpoint                       | Bindings and settings                                                                                                         |
| --------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| [`cv-download`](./cv-download/)               | `GET /download?file=cv/<name>` | R2 `PORTFOLIO_FILES`, secret `TURNSTILE_SECRET`, optional KV `RATE_LIMIT_STORE`, optional `ALLOWED_ORIGINS` (comma-separated) |
| [`feature-flag`](./feature-flag/)             | `GET /feature-flag/<name>`     | KV `KV`, values `true` or `false`                                                                                             |
| [`portfolio-settings`](./portfolio-settings/) | `GET` or `HEAD /config`        | none; the Turnstile site key is public by design                                                                              |

The frontend validates `/config` and `/feature-flag` responses with Valibot and reads `/download`
as a blob. See [Security notes](../docs/SECURITY.md) for the download flow.

## Configuration

- Routes stay in the Cloudflare dashboard. The configs have no route keys and set `workers_dev` to
  `false`, so `wrangler deploy` leaves the routes unchanged.
- Bindings and vars live in `wrangler.jsonc`; a deploy replaces what the dashboard has.
- Secrets are set with `wrangler secret put` and survive deploys. `cv-download` declares
  `TURNSTILE_SECRET` as required, so its deploy fails while the secret is missing.
- `pnpm run workers:check` bundles each Worker with `wrangler deploy --dry-run`, without a Cloudflare
  login. CI runs it in the test job.

## Deploy

`deploy-workers` in `.github/workflows/main-branch-ci-cd.yaml` deploys a Worker from `main` after
lint and tests pass, and only when its folder or `workers/package.json` changed. It runs only while
the repository variable `DEPLOY_WORKERS` is `true` and uses the secrets `CLOUDFLARE_API_TOKEN` (Edit
Cloudflare Workers) and `CLOUDFLARE_ACCOUNT_ID`.

### First deploy from this repo

`wrangler deploy` replaces the bindings and vars of a Worker with the ones in its `wrangler.jsonc`;
it does not merge them with the dashboard. On 2026-10-17 a deploy of `feature-flag` from a config
without bindings dropped its KV binding, and the endpoint returned 500 until a rollback.

Before deploying a Worker from this repo:

1. Add every binding and var it uses to its `wrangler.jsonc`, with the names and IDs shown under
   **Settings → Bindings** in the dashboard.
2. Run `pnpm run workers:check` and compare the bindings it lists with the dashboard.
3. Deploy from the Worker folder with `npx wrangler@4.151.1 deploy`. If something breaks,
   `npx wrangler@4.151.1 rollback` returns to the previous version.

Set `DEPLOY_WORKERS` to `true` only after all three Workers went through these steps.
