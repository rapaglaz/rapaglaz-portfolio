# PRD: Remove DaisyUI and migrate to self-owned Tailwind v4 theme

## Problem Statement

DaisyUI is listed as a `devDependency` and loaded as a PostCSS/Tailwind plugin. The portfolio uses almost none of DaisyUI's component library (only `navbar`, `btn btn-link`, `avatar`, and `loading loading-dots`), but the entire color system — both light and dark themes — is expressed using DaisyUI's semantic token naming convention (`--color-primary`, `--color-base-100`, `--color-base-content`, etc.) and relies on DaisyUI's plugin to register those tokens as Tailwind utility classes (`bg-base-100`, `text-primary`, `border-base-300`, etc.).

This creates unnecessary coupling: any DaisyUI v5 breaking change (variable renames, removed utilities, plugin API changes) can silently break the visual design. The dependency adds ~40 transitive packages and obscures ownership of the design system.

## Solution

Replace DaisyUI's role entirely with native Tailwind v4 primitives:

1. Migrate the semantic color token registration from the DaisyUI plugin to a Tailwind v4 `@theme inline` block in `styles.css`. This preserves all existing utility classes (`bg-base-100`, `text-primary`, etc.) while making the design system self-owned.
2. Replace the four DaisyUI component classes (`navbar`, `btn btn-link`, `avatar`, `loading loading-dots loading-sm`) with equivalent Tailwind utility compositions or a small inline `@utility` definition.
3. Remove the `@plugin 'daisyui'` declaration from `styles.css` and drop `daisyui` from `package.json`.

The visual output — including light/dark theme behavior, all animations, and all component styles — must remain pixel-identical after the migration.

## User Stories

1. As a developer, I want the color system to be defined in files I own, so that a DaisyUI release cannot silently change the portfolio's visual design.
2. As a developer, I want Tailwind utility classes like `bg-base-100` and `text-primary` to continue working after DaisyUI is removed, so that no template changes are required in the first migration step.
3. As a developer, I want the `loading` spinner in the CV download button to look identical after migration, so that the user-facing download interaction is not visually regressed.
4. As a developer, I want the avatar ring and circular crop in the hero section to look identical after migration, so that the first impression of the portfolio is not affected.
5. As a developer, I want the language switcher links to retain their current appearance and hover states after migration, so that the navigation UX is not regressed.
6. As a developer, I want the navbar background blur and border behavior to be identical after migration, so that the sticky navigation looks correct on scroll.
7. As a developer, I want `pnpm install` to produce a lockfile with ~40 fewer packages after DaisyUI is removed, so that the dependency surface is reduced.
8. As a developer, I want CI to pass without changes after DaisyUI is removed, including Playwright E2E and accessibility checks, so that correctness is verified.
9. As a developer, I want `dark:` Tailwind variants (`dark:border-accent/30`, `dark:text-primary/80`, etc.) to continue working after migration, so that dark mode is not regressed.
10. As a developer, I want the `card-ocean` component utility in `styles.css` to continue applying correct border colors via `border-primary/20` and `bg-base-100`, so that card styling across skills, certifications, and contact sections is unchanged.

## Implementation Decisions

### Color token registration — `@theme inline`

The semantic tokens (`--color-primary`, `--color-base-100`, `--color-base-200`, `--color-base-300`, `--color-base-content`, `--color-primary-content`, `--color-accent`, `--color-secondary`, `--color-neutral`) are already defined in `:root` blocks in `styles.css` (with light and dark values). DaisyUI's plugin currently generates the corresponding Tailwind utilities.

The migration uses Tailwind v4's `@theme inline` to map Tailwind color tokens to the existing CSS variables without baking in static values. This preserves dynamic light/dark switching:

```css
@theme inline {
  --color-primary: var(--color-primary);
  --color-base-100: var(--color-base-100);
  /* ... all semantic tokens */
}
```

`@theme inline` (not `@theme`) is required so that utility classes resolve the CSS variable at paint time rather than at build time.

### DaisyUI-only CSS custom properties to keep or drop

`styles.css` defines DaisyUI shape/animation variables (`--rounded-box`, `--animation-btn`, `--navbar-height`, etc.) in `:root`. Any not referenced outside DaisyUI's own CSS should be pruned. `--navbar-height` is the one custom property that may be self-authored and referenced in layout calculations — verify before removing.

### `navbar` component class

DaisyUI's `navbar` sets `display: flex`, `align-items: center`, `width: 100%`, `padding: 0.5rem`, and `min-height: 4rem`. Replace with equivalent Tailwind utilities on the element directly. Fixed positioning, blur, and border are already applied via Tailwind and are unaffected.

### `btn btn-link` component class

Used in the language switcher. Replace with explicit Tailwind utilities that replicate the baseline: no background, no border, no extra padding, `cursor-pointer`, `no-underline`. Hover/active states are already applied via Tailwind on the same element.

### `avatar` component class

DaisyUI's `avatar` is `display: inline-flex`. The inner div already carries all sizing, rounding, overflow, and ring styling via Tailwind. Replace `class="avatar"` with `class="inline-flex"` or remove the wrapper if the parent flex container maintains layout.

### `loading loading-dots loading-sm` component class

Replace with a custom `@utility loading-dots` in `styles.css` that replicates the three-dot animation using `@keyframes`. Color is inherited from `text-primary` (already applied). Size mirrors `loading-sm`.

### Migration order

Perform in this order to keep CI green at each step:

1. Add `@theme inline` block — utilities continue working, DaisyUI plugin still present.
2. Replace component classes — visual parity verified via Playwright.
3. Remove `@plugin 'daisyui'` and `daisyui` from `package.json`.

## Testing Decisions

Good tests verify that the UI looks and behaves the same as before — not that a specific CSS class is present. Avoid snapshot-testing class strings.

**Modules to test:**

- Playwright E2E suite (already exists) — run in SSG mode after each migration step to verify no visual regressions in navbar, hero avatar, language switcher, and CV download button states.
- Accessibility spec (`e2e/accessibility.spec.ts`) — run against the built output to confirm no axe violations introduced by class changes.

**Prior art:** the project already has `e2e:ssg` and `e2e:ssg:ui` scripts for exactly this kind of pre-deploy visual verification. No new test infrastructure is needed.

## Out of Scope

- Renaming the semantic color token convention (e.g. `base-100` → `ocean-bg`) — separate design system concern.
- Adding a dark mode toggle (dark mode follows `prefers-color-scheme`).
- Removing `@angular/cdk` (separate analysis required).
- Fixing the E2E deploy-gating gap in the release workflow (tracked separately).

## Further Notes

- DaisyUI v5 with Tailwind v4 communicates via the `@plugin` API, not PostCSS. Removing the plugin has no effect on the PostCSS pipeline beyond DaisyUI itself.
- The `bg-base-200/30` manual override in `styles.css` uses CSS relative color syntax (`rgba(from var(...) r g b / ...)`). This is self-contained and does not depend on DaisyUI. Review for simplification once `@theme inline` is in place, since Tailwind v4 supports opacity modifiers natively on theme tokens.
- `themes: false` in the DaisyUI config means no theme CSS is injected beyond the plugin's base variable registration, which narrows the blast radius of the removal significantly.
