// Per-engine benchmark worker. Runs ONE engine in its OWN process so the two
// module graphs never share a heap. Emits JSON on stdout for the orchestrator,
// or a human table when run directly.
//
// Usage:
//   node --expose-gc bench/worker.js <puglite|pug|webdiscus> [--json]
//
// Engines:
//   puglite   -> ../lib                       (this repo)
//   pug       -> pug                           (bare pug, what webdiscus uses)
//   webdiscus -> pug via compileClientWithDependenciesTracked().body
//                (the EXACT API @webdiscus/pug-loader calls in its loader)
//
// Aspects measured, per fixture and for the full corpus:
//   - compile time   : source generation (lex -> parse -> code-gen), no execute
//   - render time    : compile + build Function + execute -> HTML string
//   - output size    : generated JS body bytes, rendered HTML bytes
//   - memory         : peak RSS, peak heapUsed, median heapUsed across passes

'use strict';
const fs = require('fs');
const path = require('path');

const engineName = process.argv[2] || 'puglite';
const asJson = process.argv.includes('--json');
const root = path.resolve(__dirname, '..');

// ---- engine adapters: unify on { compile(src), render(src) } -----------------
function makeEngine(name) {
  // Identical options for every engine, matching what puglite's real webpack
  // loader (angular-webpack/loader.js) uses, so the comparison is apples-to-
  // apples and representative of the shipped build path.
  const OPTS = { cache: false, compileDebug: false, pretty: false, inlineRuntimeFunctions: false };
  if (name === 'puglite' || name === 'pug') {
    const e = require(name === 'pug' ? 'pug' : path.join(root, 'lib'));
    return {
      label: name,
      compile: (src, filename) => e.compileClient(src, { ...OPTS, filename }),
      render: (src, filename) => e.render(src, { ...OPTS, filename }),
    };
  }
  if (name === 'webdiscus') {
    // Mirror @webdiscus/pug-loader: it compiles via
    // pug.compileClientWithDependenciesTracked(content, opts).body
    const pug = require('pug');
    return {
      label: 'webdiscus(pug-api)',
      compile: (src, filename) =>
        pug.compileClientWithDependenciesTracked(src, { ...OPTS, filename }).body,
      // render path: build the client function and execute it, as the loader's
      // VMScript does, to produce static HTML.
      render: (src, filename) => pug.render(src, { ...OPTS, filename }),
    };
  }
  throw new Error('unknown engine: ' + name);
}

// ---- stats -------------------------------------------------------------------
function pct(sortedNs, p) {
  const idx = Math.min(sortedNs.length - 1, Math.floor((p / 100) * sortedNs.length));
  return sortedNs[idx];
}
const cmpBig = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
function summarize(samplesNs) {
  const s = samplesNs.slice().sort(cmpBig);
  const sum = s.reduce((a, b) => a + b, 0n);
  return {
    median_us: Number(pct(s, 50)) / 1000,
    p95_us: Number(pct(s, 95)) / 1000,
    mean_us: Number(sum / BigInt(s.length)) / 1000,
    n: s.length,
  };
}
function timeOnce(fn) {
  const t0 = process.hrtime.bigint();
  fn();
  return process.hrtime.bigint() - t0;
}

// ---- corpus ------------------------------------------------------------------
const fixturesDir = path.join(__dirname, 'fixtures');
const fixtures = fs
  .readdirSync(fixturesDir)
  .filter((f) => f.endsWith('.pug'))
  .sort()
  .map((f) => ({
    name: f,
    file: path.join(fixturesDir, f),
    src: fs.readFileSync(path.join(fixturesDir, f), 'utf8'),
  }));

const engine = makeEngine(engineName);

// Sample budgets: heavy fixtures get fewer samples to keep wall time sane.
function samplesFor(src) {
  if (src.length > 30000) return 60;
  if (src.length > 5000) return 200;
  return 800;
}
const WARMUP = 30;
const CORPUS_PASSES = 80;

function settle() {
  if (global.gc) {
    global.gc();
    global.gc();
  }
}

// ---- per-fixture: single-template compile + render --------------------------
const perFixture = [];
for (const fx of fixtures) {
  // warm up JIT for this fixture/engine
  for (let i = 0; i < WARMUP; i++) {
    engine.compile(fx.src, fx.file);
    engine.render(fx.src, fx.file);
  }
  settle();

  const N = samplesFor(fx.src);
  const compileNs = [];
  const renderNs = [];
  for (let i = 0; i < N; i++) compileNs.push(timeOnce(() => engine.compile(fx.src, fx.file)));
  for (let i = 0; i < N; i++) renderNs.push(timeOnce(() => engine.render(fx.src, fx.file)));

  const jsBody = engine.compile(fx.src, fx.file);
  const html = engine.render(fx.src, fx.file);
  perFixture.push({
    name: fx.name,
    srcBytes: fx.src.length,
    compile: summarize(compileNs),
    render: summarize(renderNs),
    jsBytes: typeof jsBody === 'string' ? jsBody.length : 0,
    htmlBytes: typeof html === 'string' ? html.length : 0,
  });
}

// ---- full-corpus: passes over all fixtures, track time + memory -------------
settle();
const baseRss = process.memoryUsage().rss;
const passCompileNs = [];
const passRenderNs = [];
let peakRss = 0;
let peakHeap = 0;
const heapSamples = [];
for (let p = 0; p < CORPUS_PASSES; p++) {
  passCompileNs.push(timeOnce(() => {
    for (const fx of fixtures) engine.compile(fx.src, fx.file);
  }));
  passRenderNs.push(timeOnce(() => {
    for (const fx of fixtures) engine.render(fx.src, fx.file);
  }));
  const m = process.memoryUsage();
  if (m.rss > peakRss) peakRss = m.rss;
  if (m.heapUsed > peakHeap) peakHeap = m.heapUsed;
  heapSamples.push(m.heapUsed);
}
heapSamples.sort((a, b) => a - b);

const result = {
  engine: engine.label,
  node: process.version,
  fixtures: perFixture,
  corpus: {
    compilePass_ms: Number(passCompileNs.slice().sort(cmpBig)[Math.floor(passCompileNs.length / 2)]) / 1e6,
    compilePass_p95_ms: Number(passCompileNs.slice().sort(cmpBig)[Math.floor(passCompileNs.length * 0.95)]) / 1e6,
    renderPass_ms: Number(passRenderNs.slice().sort(cmpBig)[Math.floor(passRenderNs.length / 2)]) / 1e6,
    renderPass_p95_ms: Number(passRenderNs.slice().sort(cmpBig)[Math.floor(passRenderNs.length * 0.95)]) / 1e6,
    baseRss_mb: baseRss / 1048576,
    peakRss_mb: peakRss / 1048576,
    peakHeap_mb: peakHeap / 1048576,
    medianHeap_mb: heapSamples[Math.floor(heapSamples.length / 2)] / 1048576,
  },
};

if (asJson) {
  process.stdout.write(JSON.stringify(result));
} else {
  const f2 = (n) => n.toFixed(2);
  console.log(`\n== ${result.engine}  (node ${result.node}) ==`);
  console.log('per-template  (compile µs / render µs, median):');
  for (const fx of result.fixtures) {
    console.log(
      `  ${fx.name.padEnd(12)} ${f2(fx.compile.median_us).padStart(9)}  ` +
      `${f2(fx.render.median_us).padStart(9)}   ` +
      `js=${fx.jsBytes}b html=${fx.htmlBytes}b`
    );
  }
  const c = result.corpus;
  console.log('full-corpus:');
  console.log(`  compile pass  median=${f2(c.compilePass_ms)}ms p95=${f2(c.compilePass_p95_ms)}ms`);
  console.log(`  render  pass  median=${f2(c.renderPass_ms)}ms p95=${f2(c.renderPass_p95_ms)}ms`);
  console.log(`  memory  peakRSS=${f2(c.peakRss_mb)}MB peakHeap=${f2(c.peakHeap_mb)}MB medianHeap=${f2(c.medianHeap_mb)}MB`);
}
