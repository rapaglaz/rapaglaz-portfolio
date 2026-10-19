import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Workers run on the Fetch API, which Node provides natively, so no DOM environment is needed
export default defineConfig({
  // keep the Vite cache in the root node_modules, which Git already ignores
  cacheDir: fileURLToPath(new URL('../../node_modules/.vite/workers', import.meta.url)),
  test: {
    root: fileURLToPath(new URL('.', import.meta.url)),
    environment: 'node',
    include: ['**/*.spec.js'],
  },
});
