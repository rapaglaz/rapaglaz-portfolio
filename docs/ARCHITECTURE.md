# Architecture

This is a small app, so I try to keep the structure boring and predictable.
No big framework-on-top-of-framework stuff.

## Folder layout

I organise by feature, not by “components/services/utils” layers inside every folder.
Shared bits go to a shared place.

```plaintext
src/
├── app/           # bootstrap + routing + top-level view
├── features/      # hero, navbar, contact, etc
├── ui/            # small reusable presentational components
├── services/      # shared logic (cv download, toast, config, turnstile)
├── utils/         # helpers (i18n, rxjs, scroll, animation)
└── content/       # typed static content
```

I try to keep features isolated (feature-to-feature imports are avoided). There is one exception: the navbar uses the language switcher.
It’s fine, but I keep it as a clear exception.

## Angular style

### Standalone + OnPush

Everything is standalone. Most components are presentational, so `ChangeDetectionStrategy.OnPush` is the default.
If something needs state, I keep it close to the feature or in a service.

### Zoneless + signals

Zone.js is not in the dependencies, so the app runs zoneless.
That means I need to be a bit more intentional with updates.

- Signals for local state where it makes sense
- RxJS for async stuff (HTTP, events, Turnstile)
- `toSignal()` when I want a stream as a signal

I’m not trying to force signals everywhere. For this project it’s mostly UI + a few flows.

### SSG + hydration

Production build is static (`outputMode: static`). Angular pre-renders and outputs HTML.
On the client side it hydrates, so it does not repaint the whole page.

There is a server entry because prerender needs it, and it also helps for things like loading translations in a way that works with SSG.

## State and services

Most sections have basically no “business logic”. The interesting parts are in services:

- CV download: get config → get Turnstile token → call backend endpoint → trigger browser download
- Turnstile: load script once, render widget, show modal when needed, cleanup properly
- Toasts: CDK overlay, explicit cleanup
- Feature flag: read `openToWork` from a Cloudflare Worker + KV, default is false

## Feature flag (Open to Work)

Runtime toggle for the navbar badge. It is a single public flag, not a full system.

- `GET https://rapaglaz.de/feature-flag/openToWork` → `{ "openToWork": true | false }`
- Missing flag returns `404`, frontend treats it as `false`
- Storage is Cloudflare KV, updated manually in the dashboard

## Testing approach

### Unit tests

Unit tests run via Angular’s unit-test builder with the Vitest runner.

For presentational sections I keep tests as smoke checks (renders, key elements exist, basic a11y attributes).
For services/interceptors I test actual behaviour and error paths.

### E2E (Playwright)

Playwright is used for user flows:

- language switch
- CV download (mocked backend)
- Turnstile failure cases (script blocked / verification fails)
- a11y check with axe on initial load

In CI (and in `e2e:ssg`) tests run against the static build served on port 4233.
Locally `pnpm run e2e` uses the dev server on 4200.

### Lighthouse CI

Lighthouse is there for feedback, not as a gate.
Assertions are warnings only.

Config is in `.lighthouserc.cjs` and it uses `pnpm run preview` (serves `dist/rapaglaz-portfolio/browser` on 4233).

## i18n

Transloco with JSON under `public/i18n`.

I validate translations with:

```bash
pnpm run i18n:check
```

This runs JSON validation and key parity checks.
Runtime has a strict missing handler too, so missing keys are loud.

## Trade-offs (simple ones)

- No NgRx. Not needed here.
- Runtime i18n instead of build-time. I want instant switching.
- Self-hosted CI runner. Saves minutes, but can be offline, so there is fallback.
