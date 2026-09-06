module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'pnpm run preview',
      url: ['http://localhost:4233'],
      // `serve` prints "Accepting connections at ..." when ready - the
      // previous pattern never matched, so LHCI always burned the full
      // 30s timeout before (maybe) auditing an unready server.
      startServerReadyPattern: 'Accepting connections',
      startServerReadyTimeout: 30000,
      settings: {
        preset: 'desktop',
        disableStorageReset: true,
      },
    },
    assert: {
      assertions: {
        // All assertions as 'warn' - never fail the build
        'categories:performance': ['warn', { minScore: 0.95 }],
        'categories:accessibility': ['warn', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.95 }],
        'categories:seo': ['warn', { minScore: 0.95 }],
        'categories:pwa': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
