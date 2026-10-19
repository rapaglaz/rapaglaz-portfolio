// Runtime layer rules inside the app. Boundaries between Nx projects are enforced by
// @nx/enforce-module-boundaries (eslint.module-boundaries.mjs). See docs/DEPENDENCY_BOUNDARIES.md.
const path = require('node:path');

module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'Runtime dependencies must not form cycles, including through barrel exports.',
      severity: 'error',
      from: { path: '^apps/rapaglaz-portfolio/src/app/' },
      to: { circular: true },
    },
    {
      name: 'content-is-independent',
      comment: 'Content may depend on its own layer for composition and barrel exports only.',
      severity: 'error',
      from: { path: '^apps/rapaglaz-portfolio/src/app/content/', pathNot: '\\.spec\\.ts$' },
      to: {
        path: '^apps/rapaglaz-portfolio/src/app/',
        pathNot: '^apps/rapaglaz-portfolio/src/app/content/',
      },
    },
    {
      name: 'utils-layer',
      comment: 'Utilities must not depend on features, UI, services, interceptors, or the shell.',
      severity: 'error',
      from: {
        path: '^apps/rapaglaz-portfolio/src/app/utils/',
        // Specs may test collaborators; the missing handler has a narrower logger rule below.
        pathNot: [
          '\\.spec\\.ts$',
          '^apps/rapaglaz-portfolio/src/app/utils/i18n/transloco-missing-handler\\.ts$',
        ],
      },
      to: {
        path: '^apps/rapaglaz-portfolio/src/app/(features|ui|services|interceptors|portfolio)/',
      },
    },
    {
      name: 'missing-handler-layer',
      comment: 'The missing translation handler uses the central logger to report missing keys.',
      severity: 'error',
      from: { path: '^apps/rapaglaz-portfolio/src/app/utils/i18n/transloco-missing-handler\\.ts$' },
      to: {
        path: '^apps/rapaglaz-portfolio/src/app/(features|ui|services|interceptors|portfolio)/',
        pathNot: '^apps/rapaglaz-portfolio/src/app/services/logger/logger\\.service\\.ts$',
      },
    },
    {
      name: 'ui-layer',
      comment: 'UI may depend on its own layer and utilities; test helpers are checked separately.',
      severity: 'error',
      from: { path: '^apps/rapaglaz-portfolio/src/app/ui/', pathNot: '\\.spec\\.ts$' },
      to: {
        path: '^apps/rapaglaz-portfolio/src/app/(?!testing/)',
        pathNot: '^apps/rapaglaz-portfolio/src/app/(ui|utils)/',
      },
    },
    {
      name: 'services-layer',
      comment: 'Services may depend on their own layer, utilities, and content.',
      severity: 'error',
      from: {
        path: '^apps/rapaglaz-portfolio/src/app/services/',
        // Overlay services instantiate UI; the companion rule limits that exception below.
        pathNot: [
          '\\.spec\\.ts$',
          '^apps/rapaglaz-portfolio/src/app/services/(toast/toast|turnstile/turnstile)\\.service\\.ts$',
        ],
      },
      to: {
        path: '^apps/rapaglaz-portfolio/src/app/(?!testing/)',
        pathNot: '^apps/rapaglaz-portfolio/src/app/(services|utils|content)/',
      },
    },
    {
      name: 'overlay-services-layer',
      comment:
        'Toast and Turnstile services own CDK overlay lifecycles and instantiate UI components.',
      severity: 'error',
      from: {
        path: '^apps/rapaglaz-portfolio/src/app/services/(toast/toast|turnstile/turnstile)\\.service\\.ts$',
      },
      to: {
        path: '^apps/rapaglaz-portfolio/src/app/(?!testing/)',
        pathNot: [
          '^apps/rapaglaz-portfolio/src/app/(services|utils|content)/',
          '^apps/rapaglaz-portfolio/src/app/ui/index\\.ts$',
        ],
      },
    },
    {
      name: 'interceptors-layer',
      comment: 'Interceptors may depend on their own layer, services, and utilities.',
      severity: 'error',
      from: { path: '^apps/rapaglaz-portfolio/src/app/interceptors/', pathNot: '\\.spec\\.ts$' },
      to: {
        path: '^apps/rapaglaz-portfolio/src/app/(?!testing/)',
        pathNot: '^apps/rapaglaz-portfolio/src/app/(interceptors|services|utils)/',
      },
    },
    {
      name: 'features-layer',
      comment: 'Features may depend on UI, services, utilities, and content; peer rules follow.',
      severity: 'error',
      from: { path: '^apps/rapaglaz-portfolio/src/app/features/', pathNot: '\\.spec\\.ts$' },
      to: {
        path: '^apps/rapaglaz-portfolio/src/app/(?!testing/)',
        pathNot: '^apps/rapaglaz-portfolio/src/app/(features|ui|services|utils|content)/',
      },
    },
    {
      name: 'no-cross-feature',
      comment: 'Each feature must stay independent of its peers, including the shared barrel.',
      severity: 'error',
      from: {
        path: '^apps/rapaglaz-portfolio/src/app/features/([^/]+)/',
        pathNot: ['\\.spec\\.ts$', '^apps/rapaglaz-portfolio/src/app/features/navbar/'],
      },
      to: {
        path: '^apps/rapaglaz-portfolio/src/app/features/',
        pathNot: '^apps/rapaglaz-portfolio/src/app/features/$1/',
      },
    },
    {
      name: 'navbar-feature-boundary',
      comment: 'Navbar composes the language switcher; this is the single allowed peer dependency.',
      severity: 'error',
      from: { path: '^apps/rapaglaz-portfolio/src/app/features/navbar/', pathNot: '\\.spec\\.ts$' },
      to: {
        path: '^apps/rapaglaz-portfolio/src/app/features/',
        pathNot: '^apps/rapaglaz-portfolio/src/app/features/(navbar|language-switcher)/',
      },
    },
    {
      name: 'portfolio-layer',
      comment: 'The portfolio layer may compose features and UI.',
      severity: 'error',
      from: {
        path: '^apps/rapaglaz-portfolio/src/app/portfolio/',
        // The shell component has a narrow exception for shared SEO language constants below.
        pathNot: ['\\.spec\\.ts$', '^apps/rapaglaz-portfolio/src/app/portfolio/portfolio\\.ts$'],
      },
      to: {
        path: '^apps/rapaglaz-portfolio/src/app/(?!testing/)',
        pathNot: '^apps/rapaglaz-portfolio/src/app/(portfolio|features|ui)/',
      },
    },
    {
      name: 'portfolio-component-layer',
      comment:
        'The shell uses shared language constants to build canonical and alternate SEO links.',
      severity: 'error',
      from: { path: '^apps/rapaglaz-portfolio/src/app/portfolio/portfolio\\.ts$' },
      to: {
        path: '^apps/rapaglaz-portfolio/src/app/(?!testing/)',
        pathNot: [
          '^apps/rapaglaz-portfolio/src/app/(portfolio|features|ui)/',
          '^apps/rapaglaz-portfolio/src/app/utils/i18n/index\\.ts$',
        ],
      },
    },
    {
      name: 'no-portfolio-imports',
      comment: 'Application files outside the portfolio layer must not depend on the shell.',
      severity: 'error',
      from: {
        path: '^apps/rapaglaz-portfolio/src/app/',
        // The router must load its shell; specs may exercise the shell directly.
        pathNot: [
          '^apps/rapaglaz-portfolio/src/app/portfolio/',
          '^apps/rapaglaz-portfolio/src/app/app\\.routes\\.ts$',
          '\\.spec\\.ts$',
        ],
      },
      to: { path: '^apps/rapaglaz-portfolio/src/app/portfolio/' },
    },
    {
      name: 'features-barrel-in-portfolio-only',
      comment:
        'The features barrel re-exports every section; imported outside the lazy-loaded shell, it pulls all sections into the initial bundle.',
      severity: 'error',
      from: {
        path: '^apps/rapaglaz-portfolio/src/app/',
        pathNot: ['^apps/rapaglaz-portfolio/src/app/portfolio/', '\\.spec\\.ts$'],
      },
      to: { path: '^apps/rapaglaz-portfolio/src/app/features/index\\.ts$' },
    },
    {
      name: 'no-production-to-testing',
      comment: 'Only spec files and other testing helpers may import the testing layer.',
      severity: 'error',
      from: {
        path: '^apps/rapaglaz-portfolio/src/app/',
        pathNot: ['\\.spec\\.ts$', '^apps/rapaglaz-portfolio/src/app/testing/'],
      },
      to: { path: '^apps/rapaglaz-portfolio/src/app/testing/' },
    },
    {
      name: 'no-production-to-specs',
      comment: 'Production files must not import spec files.',
      severity: 'error',
      from: {
        path: '^apps/rapaglaz-portfolio/src/app/',
        pathNot: ['\\.spec\\.ts$', '^apps/rapaglaz-portfolio/src/app/testing/'],
      },
      to: { path: '\\.spec\\.ts$' },
    },
    {
      name: 'no-orphans',
      comment:
        'Warn about isolated modules, excluding entry points, configs, routes, specs, and E2E.',
      severity: 'warn',
      from: {
        path: '^apps/rapaglaz-portfolio/src/app/',
        orphan: true,
        pathNot: [
          '(^|/)main(\\.server)?\\.ts$',
          '^apps/rapaglaz-portfolio/src/app/app\\.(config|routes)(\\.server)?\\.ts$',
          '\\.spec\\.ts$',
          '(^|/)e2e/',
        ],
      },
      to: {},
    },
  ],
  options: {
    includeOnly: '^apps/rapaglaz-portfolio/src/app/',
    exclude: '(^|/)(node_modules|dist|coverage)/',
    // Absolute path: with a relative one, TypeScript resolves the tsconfig `extends` chain twice
    tsConfig: { fileName: path.join(__dirname, 'apps/rapaglaz-portfolio/tsconfig.app.json') },
    // Ignore type-only and other erased imports: they create no runtime dependency or cycle.
    // This applies to every rule, so type-only layer violations are intentionally not reported.
    // https://github.com/sverweij/dependency-cruiser/blob/v18.6.0/doc/options-reference.md#tsprecompilationdeps
    tsPreCompilationDeps: false,
  },
};
