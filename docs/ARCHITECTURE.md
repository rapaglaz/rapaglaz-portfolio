# Architecture

The application is small, so the structure stays simple. It is a plain Angular app in an Nx
workspace. Nx runs and caches build, lint and test, and it adds no runtime code.

## Folder layout

```plaintext
apps/
├── rapaglaz-portfolio/       # the Angular app, only the bootstrap
├── rapaglaz-portfolio-e2e/   # Playwright suite
└── workers/                  # Cloudflare Workers: cv-download, feature-flag, portfolio-settings, site-fallback
libs/
├── portfolio/
│   ├── feature/              # the page: SEO tags, skills and certifications content, feature flag
│   ├── layout/               # shell, navbar, language switcher, footer
│   ├── ui/                   # the sections; they only show their inputs
│   └── util/                 # contact links, the email opener, CV file name
└── shared/
    ├── data-access/          # CV download with config and Turnstile, feature flag, API URLs
    ├── ui/                   # badge, section wrapper with scroll reveal, toasts
    ├── util/                 # logger, i18n and dictionaries, stagger delay
    └── testing/              # Transloco test setup, window mocks
```

The libraries are not buildable. With one app, a build step per library only adds work, so the app
compiles them from source through the aliases in `tsconfig.base.json`. The tags and the import
rules are described in [Dependency boundaries](./DEPENDENCY_BOUNDARIES.md).

Reasons for some placements:

- The Turnstile modal and the interceptor are in `shared-data-access`, so that the service does not
  need another layer for its overlay.
- `portfolio-util` holds the contact links and the email opener. Three libraries need them
  (`portfolio-ui`, `portfolio-layout` and `portfolio-feature`), and none of them may import another.
- The server translation loader has its own entry point, `@rapaglaz/shared/util/translations`. As
  part of the main barrel, it added both dictionaries to the main browser chunk (+5 kB).
- Each Worker is its own Nx project, so `nx affected` deploys only the Worker that changed. A deploy
  replaces the bindings of a Worker with the bindings in its `wrangler.jsonc` (this is how
  `feature-flag` lost its KV binding on 2026-10-17), so a deploy should change as little as
  possible.

`app.ts` renders `<app-portfolio />`, the shell in `portfolio-layout`: skip link, navbar, router
outlet and footer. A language switch is a new route, so the router creates only `PortfolioPage`
again, and the navbar keeps its focus and a running CV download.

## Angular style

Everything is standalone and `OnPush`. Signals hold small UI state, and RxJS handles async work
(HTTP, events, Turnstile). There is no `zone.js`, so updates are explicit
([ADR 0001](./adr/0001-zoneless-and-signals.md)). DOM measurement is in directives, not in
components: the scroll reveal, and `MeasureNavbarHeightDirective`, which sets `--navbar-height`
with a `ResizeObserver`.

### SSG and hydration

The build is static (`outputMode: static`). Angular prerenders `index.html`, `en/index.html` and
`de/index.html`, and the client hydrates them. `/`, `/en` and `/de` all lazy-load `PortfolioPage`.
The URL segment only sets the language. See [ADR 0002](./adr/0002-ssg-and-hydration.md).

Cloudflare rules in the dashboard, not in this repository, decide which file a URL returns:

- Redirect Rules: `/` answers with 302 to `/de` when `Accept-Language` starts with `de`, otherwise
  to `/en`.
- URL Rewrite Rules: `/en` and `/de` go to `/en/index.html` and `/de/index.html`.
- Response Header Transform Rule `security-headers`: see [Security](./SECURITY.md#headers).

A new locale or route needs its own rewrite rule. After the change, check `lang`, the canonical link
and the text of the page:

```bash
curl -sS https://rapaglaz.de/de | grep -E '<html|rel="canonical"'
```

## Services

- **CV download:** loads the config and a Turnstile token, calls the Worker and starts the download
  in the browser.
- **Turnstile:** loads the script once and renders the widget in the active language. An
  interactive challenge opens in a CDK Dialog with a focus trap, and the focus returns to the CV
  button. Closing the dialog in any way stops the verification, and no download starts.
- **Toasts:** one CDK overlay, reused for every toast. Errors use `role="alert"`, all other toasts
  `role="status"`. A toast stays until the user closes it, and it does not take the focus.
- **Config:** fetched once with `shareReplay`. Network errors and 5xx responses are retried three
  times (after 250 ms, 500 ms and 1 s). A 4xx response or an invalid body fails at once, and the
  cache is dropped.
- **Logger:** the only place that logs. Users never see internal details.

The CDK overlay and dialog load only when they are needed: with the first toast or the CV click.

## Feature flag (Open to Work)

One public flag for the navbar badge, not a flag system. `GET /feature-flag/openToWork` returns
`{ "openToWork": true | false }`. A missing flag returns 404 and counts as `false`. I change the
value by hand in Cloudflare KV.

In the frontend, there is one `httpResource` per flag name, cached in a `Map`. The first version
had an Observable API and a Signal API with two LRU caches, which was too complex for one flag.
Valibot validates the response in `parse`, and every unexpected value becomes `false`. On the
server the URL is `undefined`, so the prerender sends no request. Components read the flag with
`hasValue()` in a `computed`, because `value()` throws in the error state.

## Testing

Unit tests run on Vitest through `@nx/vitest`, with AnalogJS and a zoneless TestBed. The
`vitest.config.mts` of each project calls `angularVitestConfig` from `vitest.angular.mts`, which
holds the AnalogJS setup, the `forks` pool and the coverage thresholds for all projects. AnalogJS
does not type-check specs, so `pnpm run typecheck` does this, templates included, as a separate
cached task. The sections have smoke tests. Services and interceptors have tests for their behavior
and their error paths.

Playwright covers the language switch, the CV download (also on a Pixel 7 profile), Turnstile
errors, axe checks in EN/DE and in light and dark mode, contrast (4.5:1 for text, 3:1 for icons and
focus indicators) and reduced motion. CI tests the static build. `pnpm run e2e` uses the dev server.

## i18n

Transloco with JSON files in `libs/shared/util/src/i18n`. A strict missing handler reports missing
keys, and `/` falls back to `en`.

The app initializer loads the first translations for the prerender and the hydration. A route
resolver then loads the language of the URL and updates `<html lang>` before the page is created,
also on Back and Forward. If German fails to load, the resolver redirects to `/en`. If English fails
to load, the navigation is canceled. The error messages of the bootstrap come from the bundled
dictionaries, so they appear in the right language even when the loading fails.

`pnpm run i18n:check` fails on missing and unused keys. Keys built at runtime or passed as inputs
are listed in `t(...)` comments next to their use, because transloco-keys-manager cannot find them.

## Error pages

`ErrorPage` in `portfolio-layout` has two variants, which the route data selects. The route `**`
shows "Page not found" instead of a redirect to the home page, and the route `error` shows
"Something went wrong" with a reload button. Both keep the navbar and the footer, set `noindex` and
a title while they are visible, and give the previous values back when the router leaves them.

A failed navigation, for example a lazy chunk that a new deploy removed, goes to `/error` through
`withNavigationErrorHandler`. The address bar does not change: after a failed first load it still
shows the page that the visitor asked for, so a reload retries it. When someone opens `/error`
directly, the reload button leads to the home page, because a reload would only show the error
page again. The handler logs the path without the query string. An error on `/error` itself
is not redirected again, so there is no loop. The prerender does not use the handler, so a failing
route still fails the build.

The pages cannot cover an address that a visitor types in: the site is static, so the web host
answers an unknown path with its own 404 before the app starts. The pages appear for links inside
the app, in `ng serve` and on a host that falls back to `index.html`. For this reason the E2E tests
start on a real page and move on with the history API, so they also pass against the static server.

## Trade-offs

- No NgRx. Today no state exists that a store would make simpler. A SignalStore (`@ngrx/signals`)
  comes only with the first real feature whose state is synced with the URL, is shared by
  components that are not parent and child, or is an async workflow with three or more states in
  the UI. Stores then go to `data-access` libraries, features inject them, and UI libraries keep
  getting inputs.
