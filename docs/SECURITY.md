# Security

This is a portfolio site, not a banking app. But I wanted solid security basics.

No user data, no authentication, no payments. Just static content and CV download.

## Headers

Cloudflare Workers set security headers on all responses:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

What each header does:

- Force HTTPS (HSTS)
- Prevent MIME type sniffing
- Block iframe embedding
- Clean referrer headers on cross-origin requests
- Disable unused browser APIs (geolocation, microphone, camera)

## Bot Protection

CV downloads are protected with **Cloudflare Turnstile** (privacy-friendly alternative to reCAPTCHA).

Flow:

1. User clicks "Download CV"
2. Turnstile widget appears (or auto-passes if user looks legitimate)
3. Frontend sends verification token to Cloudflare Worker
4. Worker validates token against Cloudflare API
5. If valid, Worker returns signed R2 URL

Why Turnstile instead of reCAPTCHA:

- No Google tracking
- No cookies
- Faster user experience
- Works well with Cloudflare infrastructure

## File Access

CV files are not served as public static assets. They live in a private R2 bucket.

After Turnstile verification passes, the Worker generates a signed URL valid for 5 minutes:

```ts
const signedUrl = await r2Bucket.generateSignedUrl(cvKey, {
  expiresIn: 300, // 5 minutes
  method: 'GET',
});
```

What this means:

- Files can't be indexed by search engines
- URLs expire quickly
- Can't share permanent download links
- Easy to track or rate-limit downloads if needed

Extra step for users but I prefer this over having my CV floating around the internet forever.

## Dependencies

**Renovate** handles automatic dependency updates. SonarCloud runs in CI when tests run and the token is available.

No secrets stored in the repo. Everything goes into environment variables (Cloudflare Workers config or GitHub Secrets).

For major version bumps (Angular, Tailwind, Playwright, Transloco) I review changes manually even if tests pass. Want to make sure nothing unexpected gets added.

## Threat Model

| Threat         | Mitigation                      | Risk Level |
| -------------- | ------------------------------- | ---------- |
| XSS            | Angular sanitisation            | Low        |
| Clickjacking   | X-Frame-Options: DENY           | None       |
| MITM           | HSTS + Cloudflare SSL           | None       |
| CV scraping    | Turnstile + signed URLs         | Low        |
| DDoS           | Cloudflare edge protection      | Low        |
| Leaked secrets | None in repo, all env variables | None       |

No user data, no login, no file uploads — attack surface is pretty small.

## If Something Goes Wrong

Cloudflare Worker can be updated and deployed within minutes. Then fix the actual code in the repo, let CI rebuild, and document what happened.

Personal project but I treat it like production — quick patches, short feedback loops.
