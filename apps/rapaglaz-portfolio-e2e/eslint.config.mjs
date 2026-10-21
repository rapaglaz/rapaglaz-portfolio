import playwright from 'eslint-plugin-playwright';
import baseConfig from '../../eslint.config.mjs';

export default [
  playwright.configs['flat/recommended'],
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.js'],
    rules: {
      // the two browser projects skip what they cannot run, always with a condition and a reason
      'playwright/no-skipped-test': ['warn', { allowConditional: true }],
    },
  },
];
