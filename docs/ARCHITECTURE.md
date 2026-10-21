# Architecture

The app is small, so I keep the structure boring. It is a plain Angular app in an Nx workspace. Nx
runs and caches build, lint and test; it adds no runtime code.

## Folder layout

```plaintext
apps/
├── rapaglaz-portfolio/       # the Angular app, only the bootstrap
├── rapaglaz-portfolio-e2e/   # Playwright suite
└── workers/                  # Cloudflare Workers: cv-download, feature-flag, portfolio-settings
libs/
├── portfolio/
│   ├── feature/              # the page: SEO tags, skills and certifications content, feature flag
│   ├── layout/               # shell, navbar, language switcher, footer
│   ├── ui/                   # the sections; they only show their inputs
│   └── util/                 # contact links, the email opener, CV file name
└── shared/
    ├── data-access/          # CV download with config and Turnstile, feature flag
    ├── ui/                   # badge, section wrapper with scroll reveal, toasts
    ├── util/                 # logger, API tokens, i18n and dictionaries, animation
    └── testing/              # Transloco test setup, window mocks
```

The libraries are not buildable. With one app, a build step per library only adds work, so the app
compiles them from source through the aliases in `tsconfig.base.json`. Tags and import rules are in
[Dependency boundaries](./DEPENDENCY_BOUNDARIES.md).

Some placements are not obvious:

- The Turnstile modal and interceptor are in `shared-data-access`, so a service does not reach into
  another layer for its overlay.
- The server translation loader has its own entry point, `@rapaglaz/shared/util/translations`. From
  the main barrel it put both dictionaries into the main chunk of the browser (+5 kB).
- Each Worker is its own Nx project, so `nx affected` deploys only the Worker that changed. A deploy
  replaces the bindings of a Worker with those in its `wrangler.jsonc` (that is how `feature-flag`
  lost its KV binding on 2026-10-17), so I want a deploy to touch as little as possible.

`app.ts` renders `<app-portfolio />`, the shell in `portfolio-layout`: skip link, navbar, router
outlet and footer. A language switch is a new route, so the router recreates only `PortfolioPage`,
and the navbar keeps its focus and a running CV download.

## Angular style

Everything is standalone and `OnPush`. Signals hold small UI state, RxJS handles async work (HTTP,
events, Turnstile). There is no `zone.js`, so updates are explicit
([ADR 0001](./adr/0001-zoneless-and-signals.md)). DOM measuring is in directives, not components:
scroll reveal, and `MeasureNavbarHeightDirective`, which sets `--navbar-height` with a
ResizeObserver.

### SSG and hydration

The build is static (`outputMode: static`). Angular prerenders `index.html`, `en/index.html` and
`de/index.html`, and the client hydrates them. `/`, `/en` and `/de` all lazy-load `PortfolioPage`.
The URL segment only sets the language. See [ADR 0002](./adr/0002-ssg-and-hydration.md).

Cloudflare rules in the dashboard, not this repo, decide which file a URL gets:

- Redirect Rules: `/` answers 302 to `/de` when `Accept-Language` starts with `de`, otherwise to
  `/en`.
- URL Rewrite Rules: `/en` and `/de` go to `/en/index.html` and `/de/index.html`.
- Response Header Transform Rule `security-headers`: see [Security](./SECURITY.md#headers).

A new locale or route needs its own rewrite rule. Check `lang`, the canonical link and the text with
`curl -sS https://rapaglaz.de/<path>`.

## Services

- **CV download:** gets the config and a Turnstile token, calls the Worker and starts the download
  in the browser.
- **Turnstile:** loads the script once and renders the widget in the active language. An interactive
  challenge opens in a CDK Dialog with a focus trap, and focus returns to the CV button. Closing the
  dialog in any way stops the verification, and no download starts.
- **Toasts:** one CDK overlay that is reused for every toast. Errors use `role="alert"`, the rest
  `role="status"`. A toast stays until the user closes it. It does not take focus.
- **Config:** fetched once with `shareReplay`. Network errors and 5xx are retried three times
  (250 ms, 500 ms, 1 s). A 4xx or an invalid body fails at once, and the cache is dropped.
- **Logger:** the only place that logs. Users never see internal details.

The CDK overlay and dialog load only when needed, with the first toast or the CV click.

## Feature flag (Open to Work)

One public flag for the navbar badge, not a flag system. `GET /feature-flag/openToWork` returns
`{ "openToWork": true | false }`. A missing flag gives 404 and reads as `false`. I change the value
by hand in Cloudflare KV.

On the frontend it is one `httpResource` per flag name, cached in a `Map`. The first version had an
Observable and a Signal API with two LRU caches, which was too much for one flag. Valibot validates
the response in `parse`, and anything unexpected becomes `false`. On the server the URL is
`undefined`, so prerender sends no request. Components read the flag with `hasValue()` in a
`computed`, because `value()` throws in the error state.

## Testing

Unit tests run on Vitest through `@nx/vitest`, with AnalogJS and a zoneless TestBed. Each project
has its own config and coverage thresholds. AnalogJS does not type-check specs, so
`pnpm run typecheck` does it, templates included, as a separate cached task. Sections get smoke
tests. Services and interceptors get tests for behavior and error paths.

Playwright covers the language switch, the CV download (also on a Pixel 7 profile), Turnstile
failures, axe checks in EN/DE and light/dark, contrast (4.5:1 for text, 3:1 for icons and focus
indicators) and reduced motion. CI tests the static build. `pnpm run e2e` uses the dev server.

## i18n

Transloco with JSON in `libs/shared/util/src/i18n`. A strict missing handler reports missing keys,
and `/` falls back to `en`.

The app initializer loads the first translations for prerender and hydration. A route resolver then
loads the language of the URL and updates `<html lang>` before the page is created, also on
Back/Forward. If German fails to load, it redirects to `/en`. If English fails, navigation is
canceled. Bootstrap error messages come from the bundled dictionaries, so they show in the right
language even when loading fails.

`pnpm run i18n:check` fails on missing and unused keys. Keys built at runtime or passed as inputs
are listed in `t(...)` comments next to their use, because transloco-keys-manager cannot see them.

## Trade-offs

- No NgRx yet. It is planned for state that more than one component shares. Stores will go to
  `data-access` libraries, features will inject them, and UI libraries keep getting inputs.
