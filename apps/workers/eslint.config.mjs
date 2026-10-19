import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';

// Own config for the Cloudflare Workers: ESLint uses the config nearest to each file, so the root
// config (Angular, TypeScript) does not apply here, and a change to it does not affect the Workers.
export default defineConfig({
  files: ['**/*.{js,mjs}'],
  extends: [eslint.configs.recommended, eslintConfigPrettier],
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    // Workers runtime (Fetch API) globals the sources use
    globals: {
      AbortController: 'readonly',
      AbortSignal: 'readonly',
      Headers: 'readonly',
      Request: 'readonly',
      Response: 'readonly',
      TextEncoder: 'readonly',
      URL: 'readonly',
      URLSearchParams: 'readonly',
      clearTimeout: 'readonly',
      console: 'readonly',
      crypto: 'readonly',
      fetch: 'readonly',
      setTimeout: 'readonly',
    },
  },
});
