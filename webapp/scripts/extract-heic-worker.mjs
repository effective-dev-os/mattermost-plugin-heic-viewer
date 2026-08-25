// Re-run this after bumping the `heic-to` devDependency version to regenerate
// webapp/vendor/heic-worker.js. See that file's header for why this exists.
//
// heic-to's public API only exposes its worker via an internal blob: URL,
// which Mattermost's CSP blocks. This script drives just enough of heic-to's
// module init (stubbing Worker/Blob/URL.createObjectURL) to capture the exact
// worker bundle string it would have blob-ified, so we can serve it as a real
// static file instead. Run from webapp/ after `npm install`:
//   node scripts/extract-heic-worker.mjs
// then copy the printed output path's content into vendor/heic-worker.js,
// below the header comment.

global.Worker = class {
    constructor() {}
    postMessage() {}
    addEventListener() {}
    removeEventListener() {}
};

let captured = null;
class FakeBlob {
    constructor(parts) {
        captured = parts[0];
    }
}
global.Blob = FakeBlob;
global.URL.createObjectURL = () => 'fake://captured';
global.document = global.document || {};
global.self = global.self || global;

const mod = await import('heic-to/csp');
// loadWorker() runs synchronously inside decodeBuffer, before any await
// suspends on the (never-resolving) fake worker — we only need that
// synchronous part to have executed, so this call is fire-and-forget.
mod.heicTo({blob: {arrayBuffer: async () => new ArrayBuffer(16)}, type: 'bitmap'}).catch(() => {});

await new Promise((resolve) => {
    setTimeout(resolve, 200);
});

if (!captured) {
    console.error('FAILED: did not capture worker content — heic-to internals may have changed, inspect src/index.js\'s loadWorker().');
    process.exit(1);
}

if (!captured.includes('HeifDecoder') || !captured.includes('onmessage')) {
    console.error('FAILED: captured content missing expected markers (HeifDecoder / onmessage) — heic-to internals may have changed.');
    process.exit(1);
}

const fs = await import('fs');
const outPath = '/tmp/extracted-heic-worker.js';
fs.writeFileSync(outPath, captured);
console.log(`OK: captured ${captured.length} bytes, written to ${outPath}`);
process.exit(0);
