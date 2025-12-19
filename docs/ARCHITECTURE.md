# Architecture

How the project is structured and why I built it this way. I keep it small and clear.

## Main Decisions

### Feature-Based Folders

Code is organised by feature, not by technical layer:

```plaintext
src/
├── features/      # hero, navbar, contact, certifications
├── ui/            # button, badge, toast, modal
├── services/      # cv-download, toast, config, logger
├── utils/         # helpers, pipes, directives
└── content/       # skills, certifications (static data)
```

Most features are self-contained. Shared pieces go to `ui/` or `services/`.

I try to avoid feature-to-feature imports, but there is one small exception. The navbar uses the language switcher.

### Signals + Zoneless

App runs without Zone.js. It uses signals for state tracking.

Why:

- Better performance (no zone patching overhead)
- Clearer mental model for updates
- Zone.js is getting deprecated

Trade-off: you need to be explicit about change detection. I use `effect()` for side effects and `toSignal()` when bridging RxJS streams.

Mixing signals and observables works fine, just need to know what triggers updates. Zone.js is removed from dependencies, so the app stays zoneless by default.

### SSG + Hydration

Production build uses SSG via `outputMode: static`. Angular pre-renders the routes using the server entry, then ships static HTML and JS.

I keep a server config so prerender can use a file-based Transloco loader. Client bootstraps with hydration enabled, so it picks up the static HTML without full re-render.

## Folder Structure

- **`src/app/`** — Bootstrap and routing config
- **`src/features/`** — UI sections (hero, navbar, contact, about, skills, certifications, footer, languages, language-switcher)
- **`src/ui/`** — Presentational components (button, badge, toast-container, turnstile-modal, section-wrapper)
- **`src/services/`** — Shared logic and state (cv-download, toast, config, logger, turnstile)
- **`src/utils/`** — Helpers for animations, i18n, RxJS, scrolling
- **`src/content/`** — Static typed data (skills, certifications, contact)

Most features have `.ts` and `.html` files in the same folder. Some small components use inline templates, and a few have no local CSS file.

## State Management

Mostly signals for local UI state. Shared logic lives in services.

RxJS is still used for async work (HTTP, events, Turnstile flow). `toSignal()` bridges the gap when I need signals from streams.

Toast handling is done via Angular CDK overlay and manual cleanup, so it stays simple and predictable.

## Testing

### Unit Tests

Vitest via the Angular test runner.

Most tests check:

- Component renders without errors (smoke tests)
- User interactions trigger expected behaviour
- Services handle success and error paths

Not trying to hit 100% coverage. Focus is on critical paths and edge cases.

### E2E Tests

Playwright for real user flows:

- CV download with Turnstile verification
- Language switching
- Contact links
- Responsive behaviour

Runs headless in CI (Chromium). Use `--ui` flag locally for debugging with step-by-step UI.

### Performance Testing

Lighthouse CI tracks performance metrics:

- Runs on PR when source files change and weekly (Monday 6:00 AM)
- Tests desktop performance (3 runs, median score)
- Tracks Performance, Accessibility, Best Practices, SEO
- All assertions set to 'warn' so it never blocks merges
- Uploads reports to temporary public storage

Configuration in [`.lighthouserc.cjs`](../.lighthouserc.cjs). See [`CI_STRATEGY.md`](./CI_STRATEGY.md) for details.

## i18n (Internationalisation)

Using **Transloco** for runtime translations. Translation files are in `public/i18n/` as JSON.

Validation:

```bash
pnpm run i18n:check
```

This runs two checks:

- `pnpm run i18n:validate` — validates JSON structure
- `pnpm run i18n:find` — checks key parity between language files

CI runs this validation to catch missing keys. Runtime also has `StrictTranslocoMissingHandler` as a safety net and logs missing keys to console.

Why runtime instead of build-time:

- Instant language switching (no page reload)
- No rebuild needed when updating translations
- Single build serves multiple languages

## Security

Check [`SECURITY.md`](./SECURITY.md) for full details.

Key points:

- Cloudflare handles SSL and security headers
- Turnstile protects CV downloads from bots
- Signed R2 URLs expire in 5 minutes
- No sensitive data in localStorage or URL params

## CI/CD

See [`CI_STRATEGY.md`](./CI_STRATEGY.md) for complete breakdown.

Self-hosted runner does most of the work. Auto-fallback to GitHub runners if it's offline.

## Styling

Tailwind 4 for layout and utilities. Custom CSS for animations and specific visual effects.

Global styles live in `src/styles.css`. It defines theme variables, base overrides, fonts, and a few shared animation utilities. Component styles stay close to the component when needed.

DaisyUI provides button variants, spinners, and some base components. Most UI is custom-built.

## Code Quality

- ESLint with Angular-specific rules
- Strict TypeScript config
- SonarCloud for code quality trends
- Coverage thresholds enforced in Vitest config
- actionlint for GitHub Actions workflow validation

Not perfect but solid enough.

## Trade-offs

**No NgRx or other state library**
Project is too small. Signals are enough.

**Self-hosted CI runner**
Saves GitHub Actions minutes but creates single point of failure. Fallback logic works well.

**Runtime i18n instead of build-time**
Better UX for language switching, simpler to maintain translations.
