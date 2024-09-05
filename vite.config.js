import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/queryform.js'),
      name: 'QueryForm',
      fileName: (format) => `queryform.${format}.js`,
      formats: ['es', 'umd'],  // Use ES module format
    },
    sourcemap: true,
  },
  // add a server to render ./tests/index.html
  server: {
    open: '/tests/index.html',
    port: 4173,
  },
});