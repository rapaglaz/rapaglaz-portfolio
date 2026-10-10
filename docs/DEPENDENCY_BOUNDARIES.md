# Dependency boundaries

Dependency-cruiser checks the runtime imports in this single Angular app. The rules live in
[`../.dependency-cruiser.cjs`](../.dependency-cruiser.cjs); they are separate from ESLint.

## Commands and scope

```bash
pnpm run deps:check
pnpm run deps:graph
```

`deps:check` scans every supported module under `src/app`, including specs and barrel exports.
It exits non-zero for error-severity violations. All boundary and cycle rules are errors;
`no-orphans` remains a warning. Both GitHub Actions workflows run this command through the
shared quality-check action's lint mode.

`deps:graph` writes an HTML dependency matrix to `tmp/dependency-cruiser/dependencies.html`.
It creates the directory automatically. The existing `/tmp` Git ignore covers this output.
The matrix works without GraphViz; it is not a node-and-edge SVG graph.

Resolution uses `tsconfig.app.json`. The graph is restricted to `src/app`, with `node_modules`,
`dist`, and `coverage` excluded. Imports outside `src/app`, including external packages, are
outside these layer checks. Dynamic imports and runtime re-exports are included.

`tsPreCompilationDeps: false` excludes type-only and other imports erased during compilation.
They cannot create runtime initialization cycles. This setting applies to every rule, so it
also excludes type-only layer violations. See the
[dependency-cruiser option reference](https://github.com/sverweij/dependency-cruiser/blob/v18.5.0/doc/options-reference.md#tsprecompilationdeps).

`no-orphans` means modules without incoming or outgoing dependencies in the scoped graph;
it is not a complete unused-code analysis. Entry points (`main.ts`, `main.server.ts`), app
configs/routes, specs, and E2E files are excluded from orphan warnings. The main entry points
and repository-level E2E files already fall outside `src/app`.

## Layer rules

Imports within the same layer are allowed. The table describes additional application-layer
dependencies before the narrow exceptions below.

| Source layer   | Additional allowed targets                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------- |
| `content`      | None; content may compose other content and re-export it through its barrel.                    |
| `utils`        | `content`; no features, UI, services, interceptors, or portfolio.                               |
| `ui`           | `utils`                                                                                         |
| `services`     | `utils`, `content`                                                                              |
| `interceptors` | `services`, `utils`                                                                             |
| `features`     | `ui`, `services`, `utils`, `content`                                                            |
| `portfolio`    | `features`, `ui`                                                                                |
| `testing`      | May use application modules for test support. Only specs and other testing files may import it. |

Features cannot import another feature or the shared `features/index.ts` barrel. The one
peer exception is `features/navbar` importing `features/language-switcher`. The root feature
barrel may re-export features so that the portfolio shell can compose them.

Specs are exempt from layer rules because they need to construct and mock collaborators.
They remain in cycle analysis. Production files cannot import `*.spec.ts` files or `testing`.
Files outside the portfolio layer cannot import portfolio, except for specs and the route
entry point listed below.

## Narrow exceptions

Every exception has a comment in the configuration. The specialized rules keep all other
forbidden targets checked for the source files that need an exception.

| Source                                            | Additional allowed target                   | Reason                                                                                        |
| ------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/app/utils/i18n/transloco-missing-handler.ts` | `src/app/services/logger/logger.service.ts` | Missing keys must use the central logger. The direct import avoids the services barrel cycle. |
| `src/app/services/toast/toast.service.ts`         | `src/app/ui/index.ts`                       | The service owns the CDK overlay lifecycle and instantiates the toast UI.                     |
| `src/app/services/turnstile/turnstile.service.ts` | `src/app/ui/index.ts`                       | The service owns the CDK overlay lifecycle and instantiates the Turnstile modal.              |
| `src/app/portfolio/portfolio.ts`                  | `src/app/utils/i18n/index.ts`               | Shared language constants drive canonical and alternate SEO links.                            |
| `src/app/app.routes.ts`                           | The `portfolio` layer                       | The router must lazy-load the portfolio shell.                                                |

There is no cycle allow-list. Importing the central logger directly fixes the original cycle
without changing the missing handler's behavior or moving files.

## Initial report and decisions

On 2026-10-08 the first check ran with every rule set to `warn`. It exited `0` and reported
11 warnings across 81 modules and 135 runtime dependencies. This was a migration report,
not an enforced passing architecture check.

The complete report was:

```text
no-circular (C1)
src/app/services/cv-download/cv-download.service.ts
  -> src/app/utils/i18n/index.ts
  -> src/app/utils/i18n/transloco-missing-handler.ts
  -> src/app/services/index.ts
  -> src/app/services/cv-download/cv-download.service.ts

utils-layer
U1: src/app/utils/i18n/transloco-missing-handler.ts -> src/app/services/index.ts
U2: src/app/utils/i18n/transloco-missing-handler.spec.ts -> src/app/services/index.ts
U3: src/app/utils/i18n/browser-language.spec.ts -> src/app/services/index.ts

services-layer
S1: src/app/services/turnstile/turnstile.service.ts -> src/app/ui/index.ts
S2: src/app/services/toast/toast.service.ts -> src/app/ui/index.ts

portfolio-layer
P1: src/app/portfolio/portfolio.ts -> src/app/utils/i18n/index.ts

no-portfolio-imports
P2: src/app/app.routes.ts -> src/app/portfolio/portfolio.ts

content-is-independent
D1: src/app/content/index.ts -> src/app/content/certifications.content.ts
D2: src/app/content/index.ts -> src/app/content/contact.content.ts
D3: src/app/content/index.ts -> src/app/content/skills.content.ts
```

The reviewed decisions were:

- C1: replace the missing handler's services barrel import with the direct logger import.
- U1: allow only that handler's dependency on the central logger file.
- U2–U3: exempt specs from layer rules; keep testing isolation and cycle detection active.
- S1–S2: allow the two overlay services to instantiate UI through the existing UI barrel.
- P1: allow only the shell component to use the i18n barrel for its SEO language constants.
- P2: allow the router to load portfolio; keep other production dependents forbidden.
- D1–D3: allow content-to-content dependencies, including its barrel re-exports.

Alternative: restructuring logging, overlays, or SEO could remove these exceptions, but that
would expand the change into a production refactor. Narrow file-level exceptions preserve
the app's current responsibilities while making future violations fail.

## Enforcement verification

On 2026-10-08, two temporary probes verified that error severities fail the command:

| Scenario                                                      | Command               | Exit code | Reported rule      |
| ------------------------------------------------------------- | --------------------- | --------- | ------------------ |
| Temporary hero file imports `features/about/about.ts`         | `pnpm run deps:check` | `1`       | `no-cross-feature` |
| Two temporary files under `utils/animation` import each other | `pnpm run deps:check` | `1`       | `no-circular`      |
| Normal application graph                                      | `pnpm run deps:check` | `0`       | No violations      |

The probes used side-effect imports so TypeScript could not erase unused bindings. Both
probe sets were removed after their checks; they are not part of the application or test
suite. Their local command output is saved in the ignored
`tmp/dependency-cruiser/enforcement-probes.txt` file.
