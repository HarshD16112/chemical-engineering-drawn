// segments.mjs — shared logic for splitting / rebuilding the Nomograph app.
//
// The deployed root `Nomograph.html` is a self-contained Claude artifact
// *bundle*: the real application document is stored, verbatim, inside its
// <script type="__bundler/template"> tag as a JSON string. External libraries
// (React) and fonts/KaTeX live in the sibling <script type="__bundler/manifest">
// tag and are re-inlined by the bundle's own runtime in the browser.
//
// This module does two things, with ZERO transformation of bytes:
//   1. extractApp()  — pull the embedded application document out of the bundle.
//   2. plan(appText) — describe how that document is partitioned, line for line,
//                      into the readable files under src/. The partition covers
//                      every line exactly once, so concatenating the parts in
//                      order reproduces the document byte-for-byte.
//
// Because the split is a pure line partition, round-tripping is lossless by
// construction and is asserted by both split.mjs and build.mjs.

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

export const ROOT = path.resolve(url.fileURLToPath(new URL('..', import.meta.url)));
export const BUNDLE = path.join(ROOT, 'Nomograph.html');
export const SRC = path.join(ROOT, 'src');
export const MANIFEST = path.join(SRC, 'build-manifest.json');

// ---- pull the embedded application document out of the deployed bundle ----
export function extractApp(bundlePath = BUNDLE) {
  const html = fs.readFileSync(bundlePath, 'utf8');
  const lines = html.split('\n');
  const i = lines.findIndex((l) => l.trim() === '<script type="__bundler/template">');
  if (i < 0) throw new Error('bundle template tag not found in ' + bundlePath);
  const payload = lines[i + 1];
  if (payload === undefined) throw new Error('bundle template payload missing');
  return JSON.parse(payload); // the real app document, exactly as authored
}

// ---- line array where each element carries its own trailing "\n" ----
// lines.join('') === text, exactly, for any text.
export function toLines(text) {
  const parts = text.split('\n');
  return parts.map((s, i) => (i < parts.length - 1 ? s + '\n' : s));
}

const S = (l) => l.replace(/\n$/, ''); // line without its trailing newline

// Find the single line index (1-based) matching `pred`, asserting uniqueness-ish.
function findLine(lines, pred, label, { from = 0, last = false } = {}) {
  let found = -1;
  for (let i = from; i < lines.length; i++) {
    if (pred(S(lines[i]))) {
      found = i + 1; // 1-based
      if (!last) break;
    }
  }
  if (found < 0) throw new Error('segment marker not found: ' + label);
  return found;
}

// Build a readable slug from a module group's section label (const S = '...').
function moduleName(lines, start, end, method) {
  for (let i = start; i < Math.min(end, start + 12); i++) {
    const m = S(lines[i - 1]).match(/const S = '([^']+)'/);
    if (m) {
      const slug = m[1]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      return `${method}-${slug}`;
    }
  }
  return `${method}-expansion-set`; // dNewA..dNewI span several categories (see src/README.md)
}

// ---- the partition plan: ordered list of { path, from, to } (1-based incl) ----
export function plan(appText) {
  const lines = toLines(appText);
  const N = lines.length;
  const seg = [];
  const push = (p, from, to) => seg.push({ path: p, from, to });

  // document skeleton / head
  const helmetOpen = findLine(lines, (l) => l === '<helmet>', '<helmet>');
  const style1 = findLine(lines, (l) => l.startsWith('<style>'), '<style> #1');
  const style1End = findLine(lines, (l) => l === '</style>', '</style> #1', { from: style1 });
  const style2 = findLine(lines, (l) => l.startsWith('<style>'), '<style> #2', { from: style1End });
  const style2End = findLine(lines, (l) => l === '</style>', '</style> #2', { from: style2 });
  const katexJs = findLine(lines, (l) => l.startsWith('<script src='), 'katex loader', { from: style2End });
  const style3 = findLine(lines, (l) => l.startsWith('<style>'), '<style> #3', { from: katexJs });
  const style3End = findLine(lines, (l) => l === '</style>', '</style> #3', { from: style3 });
  const runtimeJs = findLine(lines, (l) => l.startsWith('<script src='), 'runtime loader', { from: style3End });
  const style4 = findLine(lines, (l) => l.startsWith('<style>'), '<style> #4', { from: runtimeJs });
  const style4End = findLine(lines, (l) => l === '</style>', '</style> #4', { from: style4 });
  const helmetClose = findLine(lines, (l) => l === '</helmet>', '</helmet>', { from: style4End });
  const xdcClose = findLine(lines, (l) => l === '</x-dc>', '</x-dc>', { from: helmetClose });
  const mainOpen = findLine(lines, (l) => l.startsWith('<script type="text/x-dc"'), 'main script open', { from: xdcClose });

  push('document/01-head.html', 1, helmetOpen);
  push('styles/design-system.css', style1, style1End);
  push('styles/fonts-barlow.css', style2, style2End);
  push('document/02-katex-loader.html', katexJs, katexJs);
  push('styles/katex.css', style3, style3End);
  push('document/03-runtime-loader.html', runtimeJs, runtimeJs);
  push('styles/app.css', style4, style4End);
  push('document/04-preview-markup.html', helmetClose, xdcClose);
  push('document/05-main-script-open.html', mainOpen, mainOpen);

  // main application script body
  const mainClose = findLine(lines, (l) => l === '</script>', 'main script close', { from: mainOpen, last: true });
  const bodyClose = findLine(lines, (l) => l === '</body></html>', '</body></html>', { from: mainClose, last: true });
  if (bodyClose !== N) throw new Error('unexpected trailing content after </body></html>');

  // engine core — split on its section-banner comments
  const nomStart = findLine(lines, (l) => l.includes('── Nomenclature'), 'nomenclature banner', { from: mainOpen });
  const classOpen = findLine(lines, (l) => l.startsWith('class Component'), 'class Component', { from: mainOpen });

  const banner = (needle, from) =>
    findLine(lines, (l) => l.includes(needle), 'engine banner: ' + needle, { from: from - 1 });

  const bCompound = banner('── compound library', mainOpen);
  const bJoback = banner('── Joback group contributions', bCompound);
  const bUnits = banner('── units', bJoback);
  const bTex = banner('── TeX-subset renderer', bUnits);
  const bNumeric = banner('── numeric helpers', bTex);
  const bPlot = banner('── plot engine', bNumeric);
  const bCanvas = banner('── canvas lifecycle', bPlot);
  const bSchem = banner('── equipment schematic kit', bCanvas);
  const bState = banner('── module state', bSchem);
  const bCover = banner('── coverage audit', bState);
  const bRenderVals = findLine(lines, (l) => /^\s{2}renderVals\(\)\s*\{/.test(l), 'renderVals()', { from: bCover });

  // first module group method (2-space-indented dXxx() { ... })
  const isModule = (l) => /^ {2}d[A-Z][A-Za-z]*\(\)\s*\{/.test(l);
  const firstModule = findLine(lines, isModule, 'first module group', { from: bRenderVals });

  push('engine/00-class-open.js', mainOpen + 1, bCompound - 1);
  push('engine/01-compound-library.js', bCompound, bJoback - 1);
  push('engine/02-joback-formula.js', bJoback, bUnits - 1);
  push('engine/03-units.js', bUnits, bTex - 1);
  push('engine/04-tex-renderer.js', bTex, bNumeric - 1);
  push('engine/05-numeric.js', bNumeric, bPlot - 1);
  push('engine/06-plot-engine.js', bPlot, bCanvas - 1);
  push('engine/07-canvas.js', bCanvas, bSchem - 1);
  push('engine/08-schematic-kit.js', bSchem, bState - 1);
  push('engine/09-module-state.js', bState, bCover - 1);
  push('engine/10-coverage.js', bCover, bRenderVals - 1);
  push('engine/11-render-vals.js', bRenderVals, firstModule - 1);

  // module groups — one file each, in document order; last one runs to nomenclature
  const starts = [];
  for (let i = firstModule; i <= nomStart; i++) {
    if (i <= lines.length && isModule(S(lines[i - 1]))) starts.push(i);
  }
  starts.forEach((start, idx) => {
    const end = (idx + 1 < starts.length ? starts[idx + 1] : nomStart) - 1;
    const method = S(lines[start - 1]).match(/d[A-Za-z]+/)[0];
    const name = moduleName(lines, start, end, method);
    const num = String(idx + 1).padStart(2, '0');
    push(`modules/${num}-${name}.js`, start, end);
  });

  // nomenclature data, then the closing document frame
  push('data/nomenclature.js', nomStart, mainClose - 1);
  push('document/99-main-script-close.html', mainClose, N);

  // ---- validate the partition is a gap-free, overlap-free cover of 1..N ----
  let cursor = 1;
  for (const s of seg) {
    if (s.from !== cursor) throw new Error(`partition gap/overlap at ${s.path}: expected ${cursor}, got ${s.from}`);
    if (s.to < s.from) throw new Error(`empty/negative segment ${s.path}`);
    cursor = s.to + 1;
  }
  if (cursor !== N + 1) throw new Error(`partition does not reach end: cursor ${cursor}, N ${N}`);

  return { lines, N, seg };
}

// Materialize a segment's text from the line array.
export function sliceOf(lines, s) {
  return lines.slice(s.from - 1, s.to).join('');
}
