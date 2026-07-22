import { defineConfig } from 'vite';
import dockerMockPlugin from './mock/vite-docker-mock-plugin.js';

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
  },
  test: {
    root: '.',
    environment: 'node',
    include: ['test/**/*.test.js'],
  },
});
