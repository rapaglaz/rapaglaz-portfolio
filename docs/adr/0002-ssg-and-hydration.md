# ADR 0002: Static prerendering and hydration instead of SSR

**Status:** Accepted, recorded on 2026-10-19 · **Date:** 2025-12-19
([#91](https://github.com/rapaglaz/rapaglaz-portfolio/pull/91); `outputMode: static` since `67a81f4`)

**Context.** The content lives in the repository (translations, skills, certifications). The only
runtime data is the feature flag, the config and the CV download, all from Cloudflare Workers.

**Decision.** `outputMode: static`: the build prerenders `/`, `/en` and `/de` to `index.html`,
`en/index.html` and `de/index.html`, and the client hydrates that HTML. Browser APIs are guarded
with `isPlatformBrowser`. The flag resource has no URL on the server, so prerender sends no request.

**Alternatives considered.**

- SSR with a Node server. A request has nothing to render that the build cannot, because the
  content is in the repo. Production is static files over FTPS, with no Node server in the setup.
- Client-side rendering only, as before #91. The HTML is empty until the bundle has run.

**Consequences.**

- Production is static files: `main` deploys the tested build over FTPS.
- Cloudflare rules outside this repo decide which file a URL gets. Until 2026-10-18 both rewrites
  pointed at the English prerender, so `/de` served `lang="en"`
  ([#792](https://github.com/rapaglaz/rapaglaz-portfolio/pull/792)). A new locale or route needs
  its own rewrite rule.
