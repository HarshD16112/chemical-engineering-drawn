// split.mjs — one-time (re-runnable) generator.
//
// Reads the embedded application document out of the deployed Nomograph.html
// bundle and writes it, as a readable line-partition, into src/. Then it
// immediately verifies that concatenating the parts reproduces the document
// byte-for-byte. Safe to re-run: it only writes under src/ and never touches
// the deployed bundle.

import fs from 'node:fs';
import path from 'node:path';
import { extractApp, plan, sliceOf, SRC, MANIFEST } from './segments.mjs';

const app = extractApp();
const { lines, seg } = plan(app);

// clean the generated subtrees (keep hand-written files like src/README.md)
for (const sub of ['document', 'styles', 'engine', 'modules', 'data']) {
  fs.rmSync(path.join(SRC, sub), { recursive: true, force: true });
}

let bytes = 0;
for (const s of seg) {
  const out = path.join(SRC, s.path);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const content = sliceOf(lines, s);
  fs.writeFileSync(out, content);
  bytes += Buffer.byteLength(content);
}

fs.writeFileSync(
  MANIFEST,
  JSON.stringify({ generatedFrom: 'Nomograph.html', order: seg.map((s) => s.path) }, null, 2) + '\n'
);

// verify round-trip
const rebuilt = seg.map((s) => fs.readFileSync(path.join(SRC, s.path), 'utf8')).join('');
if (rebuilt !== app) throw new Error('round-trip mismatch after split');

console.log(`split ok: ${seg.length} files, ${bytes} bytes, round-trip byte-exact`);
console.log(seg.map((s) => `  ${s.path}  (lines ${s.from}-${s.to})`).join('\n'));
