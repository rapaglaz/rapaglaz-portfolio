import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Workers run on the Fetch API, which Node provides natively, so no DOM environment is needed
export default defineConfig({
  plugins: [
    {
      // Wrangler bundles an imported .html file as text; Vite needs the same rule in the spec
      name: 'html-as-text',
      enforce: 'pre',
      transform(code, id) {
        if (!id.endsWith('.html')) return null;
        return { code: `export default ${JSON.stringify(code)};`, map: null };
      },
    },
  ],
  // keep the Vite cache in the root node_modules, which Git already ignores
  cacheDir: fileURLToPath(
    new URL('../../../node_modules/.vite/workers-site-fallback', import.meta.url),
  ),
  test: {
    name: 'site-fallback',
    root: fileURLToPath(new URL('.', import.meta.url)),
    watch: false,
    environment: 'node',
    include: ['**/*.spec.ts'],
  },
});
