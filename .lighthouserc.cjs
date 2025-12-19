module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'pnpm run preview',
      url: ['http://localhost:4233'],
      startServerReadyPattern: 'Available on',
      startServerReadyTimeout: 30000,
      settings: {
        preset: 'desktop',
        disableStorageReset: true,
      },
    },
    assert: {
      assertions: {
        // All assertions as 'warn' - never fail the build
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'categories:pwa': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
