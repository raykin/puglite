// Compile-time memory + speed benchmark for puglite vs pug.
//
// Usage (run each engine in its OWN process so the two module graphs
// never share a heap):
//   node --expose-gc bench/compile-bench.js puglite [iterations]
//   node --expose-gc bench/compile-bench.js pug      [iterations]   (npm i -D pug)
//
// Reports peak RSS, peak heapUsed, and wall time. Memory and speed track
// together for a build-time compiler, so all three are measured in one run.
//
// Mirrors the real webpack path (lib/lexer -> lib/parser -> lib/code-gen),
// which is where cold-build time/memory actually goes. The loader does NOT
// use exports.compile / exports.cache, so this forces cache:false to keep
// the module-level cache out of the measurement.

const fs = require('fs');
const path = require('path');

const engineName = process.argv[2] || 'puglite';
const iterations = Number(process.argv[3] || 200);
const root = path.resolve(__dirname, '..');
const engine = require(engineName === 'pug' ? 'pug' : path.join(root, 'lib'));

function findPug(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) findPug(p, acc);
    else if (name.endsWith('.pug')) acc.push(p);
  }
  return acc;
}

const files = findPug(root);
const sources = files.map((f) => fs.readFileSync(f, 'utf8'));

if (global.gc) global.gc();
const t0 = process.hrtime.bigint();
let peakRss = 0;
let peakHeap = 0;
for (let i = 0; i < iterations; i++) {
  for (const src of sources) {
    // compileClient: same signature in pug and puglite. Generates the
    // template function source (lex -> parse -> code-gen) without executing
    // it, so it never throws on missing locals and works on any corpus.
    engine.compileClient(src, { filename: 'x.pug', cache: false });
  }
  const m = process.memoryUsage();
  if (m.rss > peakRss) peakRss = m.rss;
  if (m.heapUsed > peakHeap) peakHeap = m.heapUsed;
}
const ms = Number(process.hrtime.bigint() - t0) / 1e6;
const mb = (b) => (b / 1024 / 1024).toFixed(1);
console.log(
  `${engineName}: ${files.length} files x ${iterations} iters | ` +
  `peakRSS=${mb(peakRss)}MB peakHeap=${mb(peakHeap)}MB | wall=${ms.toFixed(0)}ms`
);
