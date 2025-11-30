# Architecture

How the project is structured and why I built it this way.

## Main Decisions

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
- Zone.js is getting deprecated

Trade-off: You need to be explicit about change detection. Use `effect()` for side effects, `toSignal()` when bridging RxJS streams.

Mixing signals and observables works fine, just need to know what triggers updates.

## Folder Structure

- **`src/app/`** — Bootstrap and routing config
- **`src/features/`** — UI sections (hero, navbar, contact, about, skills, certifications, footer, languages, language-switcher)
- **`src/ui/`** — Presentational components (button, badge, toast-container, turnstile-modal, section-wrapper)
- **`src/services/`** — Shared logic and state (cv-download, toast, config, logger, turnstile)
- **`src/utils/`** — Helpers for animations, i18n, RxJS, scrolling
- **`src/content/`** — Static typed data (skills, certifications, contact)

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

- Runs on PR (when source files change) and weekly (Monday 6:00 AM)
- Tests desktop performance (3 runs, median score)
- Tracks Performance, Accessibility, Best Practices, SEO
- All assertions set to 'warn' — never blocks merges
- Uploads reports to temporary public storage

Configuration in [`.lighthouserc.cjs`](../.lighthouserc.cjs). See [`CI_STRATEGY.md`](./CI_STRATEGY.md) for details.

## i18n (Internationalisation)

Using **Transloco** for runtime translations. Translation files in `public/i18n/` as JSON.

Validation:

```bash
pnpm run i18n:check
```

This runs two checks:

- `pnpm run i18n:validate` — validates JSON structure
- `pnpm run i18n:find` — checks key parity between language files

CI fails builds if keys are missing in any language. Runtime has `StrictTranslocoMissingHandler` as safety net — logs missing keys to console.

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

No global style overrides except base resets in `src/styles.css`. Styles stay close to components.

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
