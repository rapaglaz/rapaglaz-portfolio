# ADR 0002: Static prerendering and hydration instead of SSR

**Status:** Accepted, recorded on 2026-10-19 · **Date:** 2025-12-19
([#91](https://github.com/rapaglaz/rapaglaz-portfolio/pull/91); `outputMode: static` since `67a81f4`)

**Context.** The content is part of the repository (translations, skills, certifications). The only
runtime data are the feature flag, the config and the CV download, all from Cloudflare Workers.

**Decision.** `outputMode: static`: the build prerenders `/`, `/en` and `/de` to `index.html`,
`en/index.html` and `de/index.html`, and the client hydrates this HTML. Access to browser APIs is
guarded with `isPlatformBrowser`. The flag resource has no URL on the server, so the prerender sends
no request.

**Alternatives considered.**

- SSR with a Node server. Rendering per request has no benefit, because the build already has all
  content from the repository. Production consists of static files over FTPS, with no Node server.
- Client-side rendering only, as before #91. The HTML is empty until the bundle has run.

**Consequences.**

- Production consists of static files: `main` deploys the tested build over FTPS.
- Cloudflare rules outside this repository decide which file a URL returns. Until 2026-10-18, both
  rewrites pointed to the English prerender, so `/de` returned `lang="en"`
  ([#792](https://github.com/rapaglaz/rapaglaz-portfolio/pull/792)). A new locale or route needs
  its own rewrite rule.
