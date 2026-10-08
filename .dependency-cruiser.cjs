// Runtime architecture rules. See docs/DEPENDENCY_BOUNDARIES.md for the rollout decisions.
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'Runtime dependencies must not form cycles, including through barrel exports.',
      severity: 'error',
      from: { path: '^src/app/' },
      to: { circular: true },
    },
    {
      name: 'content-is-independent',
      comment: 'Content may depend on its own layer for composition and barrel exports only.',
      severity: 'error',
      from: { path: '^src/app/content/', pathNot: '\\.spec\\.ts$' },
      to: { path: '^src/app/', pathNot: '^src/app/content/' },
    },
    {
      name: 'utils-layer',
      comment: 'Utilities must not depend on features, UI, services, interceptors, or the shell.',
      severity: 'error',
      from: {
        path: '^src/app/utils/',
        // Specs may test collaborators; the missing handler has a narrower logger rule below.
        pathNot: ['\\.spec\\.ts$', '^src/app/utils/i18n/transloco-missing-handler\\.ts$'],
      },
      to: { path: '^src/app/(features|ui|services|interceptors|portfolio)/' },
    },
    {
      name: 'missing-handler-layer',
      comment: 'The missing translation handler uses the central logger to report missing keys.',
      severity: 'error',
      from: { path: '^src/app/utils/i18n/transloco-missing-handler\\.ts$' },
      to: {
        path: '^src/app/(features|ui|services|interceptors|portfolio)/',
        pathNot: '^src/app/services/logger/logger\\.service\\.ts$',
      },
    },
    {
      name: 'ui-layer',
      comment: 'UI may depend on its own layer and utilities; test helpers are checked separately.',
      severity: 'error',
      from: { path: '^src/app/ui/', pathNot: '\\.spec\\.ts$' },
      to: {
        path: '^src/app/(?!testing/)',
        pathNot: '^src/app/(ui|utils)/',
      },
    },
    {
      name: 'services-layer',
      comment: 'Services may depend on their own layer, utilities, and content.',
      severity: 'error',
      from: {
        path: '^src/app/services/',
        // Overlay services instantiate UI; the companion rule limits that exception below.
        pathNot: [
          '\\.spec\\.ts$',
          '^src/app/services/(toast/toast|turnstile/turnstile)\\.service\\.ts$',
        ],
      },
      to: {
        path: '^src/app/(?!testing/)',
        pathNot: '^src/app/(services|utils|content)/',
      },
    },
    {
      name: 'overlay-services-layer',
      comment:
        'Toast and Turnstile services own CDK overlay lifecycles and instantiate UI components.',
      severity: 'error',
      from: { path: '^src/app/services/(toast/toast|turnstile/turnstile)\\.service\\.ts$' },
      to: {
        path: '^src/app/(?!testing/)',
        pathNot: ['^src/app/(services|utils|content)/', '^src/app/ui/index\\.ts$'],
      },
    },
    {
      name: 'interceptors-layer',
      comment: 'Interceptors may depend on their own layer, services, and utilities.',
      severity: 'error',
      from: { path: '^src/app/interceptors/', pathNot: '\\.spec\\.ts$' },
      to: {
        path: '^src/app/(?!testing/)',
        pathNot: '^src/app/(interceptors|services|utils)/',
      },
    },
    {
      name: 'features-layer',
      comment: 'Features may depend on UI, services, utilities, and content; peer rules follow.',
      severity: 'error',
      from: { path: '^src/app/features/', pathNot: '\\.spec\\.ts$' },
      to: {
        path: '^src/app/(?!testing/)',
        pathNot: '^src/app/(features|ui|services|utils|content)/',
      },
    },
    {
      name: 'no-cross-feature',
      comment: 'Each feature must stay independent of its peers, including the shared barrel.',
      severity: 'error',
      from: {
        path: '^src/app/features/([^/]+)/',
        pathNot: ['\\.spec\\.ts$', '^src/app/features/navbar/'],
      },
      to: {
        path: '^src/app/features/',
        pathNot: '^src/app/features/$1/',
      },
    },
    {
      name: 'navbar-feature-boundary',
      comment: 'Navbar composes the language switcher; this is the single allowed peer dependency.',
      severity: 'error',
      from: { path: '^src/app/features/navbar/', pathNot: '\\.spec\\.ts$' },
      to: {
        path: '^src/app/features/',
        pathNot: '^src/app/features/(navbar|language-switcher)/',
      },
    },
    {
      name: 'portfolio-layer',
      comment: 'The portfolio layer may compose features and UI.',
      severity: 'error',
      from: {
        path: '^src/app/portfolio/',
        // The shell component has a narrow exception for shared SEO language constants below.
        pathNot: ['\\.spec\\.ts$', '^src/app/portfolio/portfolio\\.ts$'],
      },
      to: {
        path: '^src/app/(?!testing/)',
        pathNot: '^src/app/(portfolio|features|ui)/',
      },
    },
    {
      name: 'portfolio-component-layer',
      comment:
        'The shell uses shared language constants to build canonical and alternate SEO links.',
      severity: 'error',
      from: { path: '^src/app/portfolio/portfolio\\.ts$' },
      to: {
        path: '^src/app/(?!testing/)',
        pathNot: ['^src/app/(portfolio|features|ui)/', '^src/app/utils/i18n/index\\.ts$'],
      },
    },
    {
      name: 'no-portfolio-imports',
      comment: 'Application files outside the portfolio layer must not depend on the shell.',
      severity: 'error',
      from: {
        path: '^src/app/',
        // The router must load its shell; specs may exercise the shell directly.
        pathNot: ['^src/app/portfolio/', '^src/app/app\\.routes\\.ts$', '\\.spec\\.ts$'],
      },
      to: { path: '^src/app/portfolio/' },
    },
    {
      name: 'no-production-to-testing',
      comment: 'Only spec files and other testing helpers may import the testing layer.',
      severity: 'error',
      from: {
        path: '^src/app/',
        pathNot: ['\\.spec\\.ts$', '^src/app/testing/'],
      },
      to: { path: '^src/app/testing/' },
    },
    {
      name: 'no-production-to-specs',
      comment: 'Production files must not import spec files.',
      severity: 'error',
      from: {
        path: '^src/app/',
        pathNot: ['\\.spec\\.ts$', '^src/app/testing/'],
      },
      to: { path: '\\.spec\\.ts$' },
    },
    {
      name: 'no-orphans',
      comment:
        'Warn about isolated modules, excluding entry points, configs, routes, specs, and E2E.',
      severity: 'warn',
      from: {
        path: '^src/app/',
        orphan: true,
        pathNot: [
          '(^|/)main(\\.server)?\\.ts$',
          '^src/app/app\\.(config|routes)(\\.server)?\\.ts$',
          '\\.spec\\.ts$',
          '(^|/)e2e/',
        ],
      },
      to: {},
    },
  ],
  options: {
    includeOnly: '^src/app/',
    exclude: '(^|/)(node_modules|dist|coverage)/',
    tsConfig: { fileName: 'tsconfig.app.json' },
    // Ignore type-only and other erased imports: they create no runtime dependency or cycle.
    // This applies to every rule, so type-only layer violations are intentionally not reported.
    // https://github.com/sverweij/dependency-cruiser/blob/v18.5.0/doc/options-reference.md#tsprecompilationdeps
    tsPreCompilationDeps: false,
  },
};
