// define a vite config that compiles /src/queryform.js to /dist/queryform.min.js

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/queryform.js'),
      name: 'QueryForm',
      fileName: (format) => `queryform.min.js`
    },
    rollupOptions: {
      output: {
        format: 'iife',
        sourcemap: true
      }
    }
  }
});

// The above configuration will compile /src/queryform.js to /dist/queryform.min.js as an IIFE module.