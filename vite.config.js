import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import dockerMockPlugin from './mock/vite-docker-mock-plugin.js';

const htmlEntries = {
  main: fileURLToPath(new URL('./src/index.html', import.meta.url)),
  'engine/demo/index': fileURLToPath(new URL('./src/engine/demo/index.html', import.meta.url)),
  'engine/catalog/index': fileURLToPath(new URL('./src/engine/catalog/index.html', import.meta.url)),
};

// The app's index.html and assets live under src/. Serving from there keeps the
// existing relative `<script>`/`<link>` paths working untouched.
export default defineConfig({
  root: 'src',
  publicDir: false,
  plugins: [dockerMockPlugin()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: htmlEntries,
    },
  },
  test: {
    root: '.',
    environment: 'node',
    include: ['test/**/*.test.js'],
  },
});
