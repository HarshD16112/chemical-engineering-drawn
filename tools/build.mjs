// build.mjs — assemble the readable src/ tree back into the application
// document, and prove it matches what is actually deployed.
//
//   src/<parts>  --(concatenate in manifest order)-->  build/app.html
//
// The assembled document is then compared, byte-for-byte, against the
// application embedded in the deployed Nomograph.html bundle. If they differ,
// the build fails loudly — so src/ can never silently drift from the live tool.
//
// NOTE: build/app.html is the *pre-bundle* application document. It references
// React / KaTeX / fonts by the resource ids that Claude's artifact publisher
// inlines when it produces the final, self-contained Nomograph.html. In other
// words: this build reproduces the authored source; the publish step wraps it
// into the deployed bundle. Nothing here writes to Nomograph.html.

import fs from 'node:fs';
import path from 'node:path';
import { extractApp, SRC, MANIFEST, ROOT } from './segments.mjs';

const { order } = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const assembled = order.map((p) => fs.readFileSync(path.join(SRC, p), 'utf8')).join('');

const outDir = path.join(ROOT, 'build');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'app.html');
fs.writeFileSync(outFile, assembled);

const deployed = extractApp();
if (assembled !== deployed) {
  const a = assembled, b = deployed;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  throw new Error(
    `assembled app does NOT match the app embedded in Nomograph.html\n` +
      `  first difference at byte ${i}\n` +
      `  assembled length ${a.length}, deployed length ${b.length}\n` +
      `  assembled: ${JSON.stringify(a.slice(i - 40, i + 40))}\n` +
      `  deployed:  ${JSON.stringify(b.slice(i - 40, i + 40))}`
  );
}

console.log(`build ok: ${order.length} parts -> build/app.html`);
console.log(`matches the app deployed in Nomograph.html byte-for-byte (${assembled.length} bytes)`);
