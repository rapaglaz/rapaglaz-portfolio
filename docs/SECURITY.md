# Security

This is a portfolio site, not a bank.
Still, I don’t want it to be sloppy.

There is no login, no user data storage, no payments.
It’s mostly static content + a CV download endpoint.

## Headers

I set basic security headers at the Cloudflare edge (Workers).

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

Short version:

- force HTTPS
- stop iframe embedding
- reduce referrer leakage
- disable browser APIs I don’t need

## CV download protection

I don’t want the CV to be a public URL that bots can scrape forever.
Downloads go through Cloudflare Turnstile + a Worker.

Flow is:

1. user clicks “CV”
2. Turnstile runs (sometimes invisible, sometimes it asks)
3. frontend sends the token to the Worker (header)
4. Worker validates it against Cloudflare
5. if ok, Worker returns a signed R2 URL

The signed link is short lived (5 minutes).
It is an extra step, but that is the point.

## Dependencies and secrets

No secrets in the repo.
Sensitive values live in GitHub Secrets or Cloudflare config.

Renovate handles dependency updates.

## Threat model (simple)

| Threat         | What I do                  | Risk |
| -------------- | -------------------------- | ---- |
| XSS            | Angular sanitisation       | Low  |
| Clickjacking   | `X-Frame-Options: DENY`    | None |
| MITM           | HSTS + Cloudflare SSL      | None |
| CV scraping    | Turnstile + signed URLs    | Low  |
| DDoS           | Cloudflare edge protection | Low  |
| Leaked secrets | none in repo               | None |

Attack surface is small. That’s good.

## If something breaks

The Worker can be patched fast.
Then I fix the code in the repo and run checks.
