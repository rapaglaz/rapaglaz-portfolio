# Cloudflare Workers

Sources of the three Workers behind `rapaglaz.de`. This repo does not deploy them, and no Wrangler
configuration is checked in; bindings and secrets are configured in Cloudflare.

| Worker                            | Endpoint                       | Bindings and settings                                                                                                         |
| --------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| [`cv-download`](./cv-download/)   | `GET /download?file=cv/<name>` | R2 `PORTFOLIO_FILES`, secret `TURNSTILE_SECRET`, optional KV `RATE_LIMIT_STORE`, optional `ALLOWED_ORIGINS` (comma-separated) |
| [`feature-flag`](./feature-flag/) | `GET /feature-flag/<name>`     | KV `KV`, values `true` or `false`                                                                                             |
| [`config`](./config/)             | `GET` or `HEAD /config`        | none; the Turnstile site key is public by design                                                                              |

The frontend validates `/config` and `/feature-flag` responses with Valibot and reads `/download`
as a blob. See [Security notes](../docs/SECURITY.md) for the download flow.
