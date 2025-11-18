# Architecture

How the project is structured and why I built it this way. Read this if you want to understand the layout or change something.

## Main Decisions

### Standalone Components

Everything is standalone — no NgModules anywhere.

Why:

- Better tree-shaking, smaller bundles
- Easier to test (no module setup needed)
- Angular is moving this direction anyway

### Feature-Based Folders

Code organised by feature, not by technical layer:

```plaintext
src/
├── features/      # hero, navbar, contact, certifications
├── ui/            # button, badge, toast, modal
├── services/      # cv-download, toast, config, logger
├── utils/         # helpers, pipes, directives
└── content/       # skills, certifications (static data)
```

Each feature is self-contained. If something needs to be shared across features, it goes to `ui/` or `services/`.

Features don't import from each other — keeps dependencies clean.

### Signals + Zoneless

App runs without Zone.js. Uses signals for state tracking.

Why:

- Better performance (no zone patching overhead)
- Clearer mental model for when things update
- Zone.js is getting deprecated anyway

Trade-off: You need to be explicit about change detection. Use `effect()` for side effects, `toSignal()` when bridging RxJS streams.

Mixing signals and observables works fine, just need to know what triggers updates.

## Folder Structure

- **`src/app/`** — Bootstrap and routing config
- **`src/features/`** — UI sections (hero, navbar, contact, etc.)
- **`src/ui/`** — Dumb/presentational components (button, badge, toast, modal)
- **`src/services/`** — Shared logic and state (cv-download, toast, config)
- **`src/utils/`** — Helpers, pipes, directives
- **`src/content/`** — Static typed data (skills, certifications)

Each feature has `.ts`, `.html`, `.css`, and `.spec.ts` in same folder.

## State Management

Mostly signals. Local state stays in components, shared state lives in services.

Example:

```ts
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toasts = signal<Toast[]>([]);
  readonly toasts$ = this.toasts.asReadonly();
}
```

RxJS still used for async operations (HTTP, events). `toSignal()` bridges the gap when needed.

## Testing

### Unit Tests

Vitest through Angular test runner.

Most tests check:

- Component renders without errors (smoke tests)
- User interactions trigger expected behaviour
- Services handle success/error paths correctly

Not trying to hit 100% coverage. Focus is on critical paths and edge cases.

### E2E Tests

Playwright for real user flows:

- CV download with Turnstile verification
- Language switching
- Contact form links
- Responsive behaviour

Runs headless in CI (Chromium). Use `--ui` flag locally for debugging with step-by-step UI.

### Performance Testing

Lighthouse CI tracks performance metrics:

- Runs on every PR and weekly on main
- Tests desktop performance (3 runs, median score)
- Tracks Performance, Accessibility, Best Practices, SEO
- Reports as warnings — never blocks merges
- Uploads reports to temporary public storage

Configuration in [`.lighthouserc.cjs`](../.lighthouserc.cjs). See [`CI_STRATEGY.md`](./CI_STRATEGY.md) for details.

## i18n (Internationalisation)

Using **Transloco** for runtime translations. Translation files in `public/i18n/` as JSON.

Validation:

```bash
pnpm run i18n:check
```

`StrictTranslocoMissingHandler` throws error if translation keys are missing in production builds.

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

PR checks are fast (lint + unit tests). Full test suite runs on `main` branch after merge.

Self-hosted runner does most of the work. Auto-fallback to GitHub runners if it's offline.

## Styling

Tailwind 4 for layout and utilities. Custom CSS for animations and specific visual effects.

No global style overrides except base resets. Styles stay close to components where they're used.

DaisyUI provides button variants, spinners, and some base components but most UI is custom-built.

## Code Quality

- ESLint with Angular-specific rules
- Strict TypeScript config
- SonarCloud for tracking trends and code smells
- Coverage thresholds enforced in Vitest config

Not perfect but solid enough for a portfolio.

## Trade-offs I Made

**No NgRx or other state library**
Project is too small for that. Signals are enough.

**Self-hosted CI runner**
Saves GitHub Actions minutes but creates single point of failure. Fallback logic works well though.

**Runtime i18n instead of build-time**
Better UX for language switching, simpler to maintain translations.

## Useful Resources

- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Transloco Documentation](https://jsverse.github.io/transloco/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
