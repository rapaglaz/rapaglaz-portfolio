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

The configs start without bindings, so set `DEPLOY_WORKERS` only after one local deploy per Worker.
Wrangler shows how the local config differs from the dashboard and offers to update the file:

```bash
npx wrangler@4.151.1 login
cd workers/feature-flag && npx wrangler@4.151.1 deploy
```

Repeat for `portfolio-settings` and `cv-download`, keep the dashboard's `compatibility_date` if
Wrangler shows a different one, and commit the updated `wrangler.jsonc` files.
