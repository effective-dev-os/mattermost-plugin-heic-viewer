// Copies the vendored worker bundle into dist/ so it's served alongside
// main.js at runtime. See webapp/src/heic/decode.ts and
// webapp/vendor/heic-worker.js for why this file must exist as a real
// same-origin static asset rather than a blob: URL.
import fs from 'fs';

fs.mkdirSync('dist', {recursive: true});
fs.copyFileSync('vendor/heic-worker.js', 'dist/heic-worker.js');
