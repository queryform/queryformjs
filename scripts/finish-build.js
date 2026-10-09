import { copyFileSync } from 'node:fs';
// Keep the browser URL stable while providing an actual CommonJS entry point.
copyFileSync('dist/queryform.umd.js', 'dist/queryform.umd.cjs');
copyFileSync('src/queryform.d.ts', 'dist/queryform.d.ts');
