// General performance comparison: runs each engine's worker in its OWN
// process (isolated heaps) and prints side-by-side results across every
// aspect. Run: npm run bench   (or: node bench/run.js)
'use strict';
const { execFileSync } = require('child_process');
const path = require('path');

const ENGINES = ['puglite', 'pug', 'webdiscus'];
const worker = path.join(__dirname, 'worker.js');

function runEngine(name) {
  const out = execFileSync(
    process.execPath,
    ['--expose-gc', worker, name, '--json'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  );
  return JSON.parse(out);
}

const results = ENGINES.map((e) => {
  process.stderr.write(`running ${e} ...\n`);
  return runEngine(e);
});

const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);
const f2 = (n) => n.toFixed(2);

function header(cols) {
  console.log(cols.map((c, i) => (i === 0 ? pad(c, 16) : padL(c, 14))).join(''));
}
function row(label, vals) {
  console.log(pad(label, 16) + vals.map((v) => padL(v, 14)).join(''));
}

console.log('\n=================  GENERAL PERFORMANCE COMPARISON  =================');
console.log(`node ${results[0].node} | engines: ${results.map((r) => r.engine).join(', ')}`);

// ---- per-fixture compile + render medians -----------------------------------
const fixtureNames = results[0].fixtures.map((f) => f.name);
for (const metric of ['compile', 'render']) {
  console.log(`\n--- per-template ${metric} time (median µs) ---`);
  header(['fixture', ...results.map((r) => r.engine)]);
  for (const fn of fixtureNames) {
    const vals = results.map((r) => f2(r.fixtures.find((f) => f.name === fn)[metric].median_us));
    row(fn, vals);
  }
  console.log(`  (p95 µs)`);
  for (const fn of fixtureNames) {
    const vals = results.map((r) => f2(r.fixtures.find((f) => f.name === fn)[metric].p95_us));
    row(fn, vals);
  }
}

// ---- output size ------------------------------------------------------------
console.log('\n--- generated JS body size (bytes) ---');
header(['fixture', ...results.map((r) => r.engine)]);
for (const fn of fixtureNames) {
  const vals = results.map((r) => r.fixtures.find((f) => f.name === fn).jsBytes);
  row(fn, vals);
}

// ---- full-corpus + memory ---------------------------------------------------
console.log('\n--- full-corpus pass + memory ---');
header(['metric', ...results.map((r) => r.engine)]);
row('compile ms', results.map((r) => f2(r.corpus.compilePass_ms)));
row('compile p95 ms', results.map((r) => f2(r.corpus.compilePass_p95_ms)));
row('render ms', results.map((r) => f2(r.corpus.renderPass_ms)));
row('render p95 ms', results.map((r) => f2(r.corpus.renderPass_p95_ms)));
row('baseRSS MB', results.map((r) => f2(r.corpus.baseRss_mb)));
row('peakRSS MB', results.map((r) => f2(r.corpus.peakRss_mb)));
row('peakHeap MB', results.map((r) => f2(r.corpus.peakHeap_mb)));
row('medianHeap MB', results.map((r) => f2(r.corpus.medianHeap_mb)));
console.log('');
