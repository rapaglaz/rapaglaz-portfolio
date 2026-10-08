// Report-only rollout: keep all rules at warn until the existing violations are reviewed.
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'Runtime dependencies must not form cycles, including through barrel exports.',
      severity: 'warn',
      from: { path: '^src/app/' },
      to: { circular: true },
    },
    {
      name: 'content-is-independent',
      comment: 'Content must not depend on any application file, including other content files.',
      severity: 'warn',
      from: { path: '^src/app/content/' },
      to: { path: '^src/app/' },
    },
    {
      name: 'utils-layer',
      comment: 'Utilities must not depend on features, UI, services, interceptors, or the shell.',
      severity: 'warn',
      from: { path: '^src/app/utils/' },
      to: { path: '^src/app/(features|ui|services|interceptors|portfolio)/' },
    },
    {
      name: 'ui-layer',
      comment: 'UI may depend on its own layer and utilities; test helpers are checked separately.',
      severity: 'warn',
      from: { path: '^src/app/ui/' },
      to: {
        path: '^src/app/(?!testing/)',
        pathNot: '^src/app/(ui|utils)/',
      },
    },
    {
      name: 'services-layer',
      comment: 'Services may depend on their own layer, utilities, and content.',
      severity: 'warn',
      from: { path: '^src/app/services/' },
      to: {
        path: '^src/app/(?!testing/)',
        pathNot: '^src/app/(services|utils|content)/',
      },
    },
    {
      name: 'interceptors-layer',
      comment: 'Interceptors may depend on their own layer, services, and utilities.',
      severity: 'warn',
      from: { path: '^src/app/interceptors/' },
      to: {
        path: '^src/app/(?!testing/)',
        pathNot: '^src/app/(interceptors|services|utils)/',
      },
    },
    {
      name: 'features-layer',
      comment: 'Features may depend on UI, services, utilities, and content; peer rules follow.',
      severity: 'warn',
      from: { path: '^src/app/features/' },
      to: {
        path: '^src/app/(?!testing/)',
        pathNot: '^src/app/(features|ui|services|utils|content)/',
      },
    },
    {
      name: 'no-cross-feature',
      comment: 'Each feature must stay independent of its peers, including the shared barrel.',
      severity: 'warn',
      from: {
        path: '^src/app/features/([^/]+)/',
        pathNot: '^src/app/features/navbar/',
      },
      to: {
        path: '^src/app/features/',
        pathNot: '^src/app/features/$1/',
      },
    },
    {
      name: 'navbar-feature-boundary',
      comment: 'Navbar composes the language switcher; this is the single allowed peer dependency.',
      severity: 'warn',
      from: { path: '^src/app/features/navbar/' },
      to: {
        path: '^src/app/features/',
        pathNot: '^src/app/features/(navbar|language-switcher)/',
      },
    },
    {
      name: 'portfolio-layer',
      comment: 'The portfolio shell may compose features and UI; bootstrap needs require review.',
      severity: 'warn',
      from: { path: '^src/app/portfolio/' },
      to: {
        path: '^src/app/(?!testing/)',
        pathNot: '^src/app/(portfolio|features|ui)/',
      },
    },
    {
      name: 'no-portfolio-imports',
      comment: 'Application files outside the portfolio layer must not depend on the shell.',
      severity: 'warn',
      from: { path: '^src/app/', pathNot: '^src/app/portfolio/' },
      to: { path: '^src/app/portfolio/' },
    },
    {
      name: 'no-production-to-testing',
      comment: 'Only spec files and other testing helpers may import the testing layer.',
      severity: 'warn',
      from: {
        path: '^src/app/',
        pathNot: ['\\.spec\\.ts$', '^src/app/testing/'],
      },
      to: { path: '^src/app/testing/' },
    },
    {
      name: 'no-production-to-specs',
      comment: 'Production files must not import spec files.',
      severity: 'warn',
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
