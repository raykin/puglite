# Puglite Performance Notes

Tracking known performance characteristics of the webpack loader and a plan
for improving build speed. **No optimization should land before the benchmark
suite described below exists** — measure first, then optimize.

## Observed

When a real Angular app (kasa, Angular 21, several hundred `.pug` templates)
was migrated from `ngx-pug-builders` to `puglite`, cold builds got
**noticeably slower**. A cold build (after deleting `.angular/cache`) took
~30s and regenerated a multi-GB `.angular/cache`.

## Two cache layers — don't confuse them

1. **`.angular/cache` (webpack persistent filesystem cache).** Angular's
   webpack browser builder always writes this, independent of puglite. It
   caches compiled modules — *including the puglite loader's output*, because
   webpack-5 loaders are **cacheable by default**. This is the multi-GB
   directory you see.

2. **A loader-internal in-memory memo (`source → html`).** Puglite does not
   have one. But because of (1), such a memo would only help when the *same
   source string* is compiled twice within a single run — which never happens
   (each `.pug` is its own module). So an internal memo is **not** a
   meaningful win and should not be the focus.

## Where the time is NOT going

The builders are not the cause. `builders/browser` and `builders/dev-server`
are functionally equivalent to `ngx-pug-builders`: both wrap
`@angular-builders/custom-webpack` plus `executeBrowserBuilder` /
`executeDevServerBuilder` and push a single `.pug` webpack rule. Builder
overhead is the same on both sides.

## Warm vs cold

- **Warm build** (cache present): unchanged `.pug` files are NOT recompiled —
  they are served from `.angular/cache`. puglite and `ngx-pug-builders` behave
  the same here. No puglite-specific slowdown.
- **Cold build** (cache empty): every `.pug` is compiled exactly once. The
  cost is puglite's own pure-JS compiler (`lib/lexer` → `lib/parser` →
  `lib/strip-comments` → `lib/code-gen` → `lib/runtime-wrap`) versus the native
  `pug` compiler `@webdiscus/pug-loader` used. ~~This is the real lever.~~
  **Measurement disproved this — see "Measured results" below. The compiler is
  in the noise; the builder (webpack vs esbuild) is the real lever.**

## Candidate optimizations (do NOT implement yet)

- **Profile the cold-build compile path.** Find hot spots in
  `lib/lexer` / `lib/parser` / `lib/code-gen`. This is where cold-build time
  actually goes and where any real win lives.
- **Declare `this.cacheable(true)` in the loader.** This does not speed up a
  build directly; it makes the caching contract explicit so webpack's
  persistent cache treats loader output as deterministic. Correctness, not
  speed.
- An internal `source → html` memo is explicitly **out of scope** — see the
  cache-layers section above for why it would not help.

## Prerequisite: a benchmark suite

Before any of the above, add a performance/benchmark suite to this repo so we
have a baseline and can prove a change actually helps:

- A corpus of representative templates (small, medium, deeply nested, many
  attributes/bindings) under `test/` or a new `bench/`.
- Measure: single-template compile time and full-corpus cold compile time
  (cold is what matters — warm is served from `.angular/cache`).
- Run repeatedly and report median/p95, not a single run.
- Wire it so a regression is visible (a script target, optionally CI).

Only after the baseline exists should any optimization here be implemented and
re-measured against it.

## Measured results (2026-06)

Two suites were built and run. Both point to the same conclusion: **the
webpack-vs-esbuild builder, not pug compilation, drives the memory/time cost.**

### 1. Isolated compiler bench (`bench/`)

Each engine in its own Node process, same options
(`{ cache:false, compileDebug:false, pretty:false, inlineRuntimeFunctions:false }`),
corpus of small/medium/deep/attrs/large fixtures. `npm run bench`.

| engine    | compile | peak RSS | peak heap |
|-----------|---------|----------|-----------|
| puglite   | 128 ms  | 220 MB   | 88 MB     |
| pug       | 162 ms  | 236 MB   | 102 MB    |
| webdiscus | 160 ms  | 234 MB   | 102 MB    |

puglite's compiler is ~20% faster and slightly lighter than stock pug — it did
**not** strip optimizations that would make it heavier.

### 2. Real Angular app, 3-way cold build (`angular-puglite-demo`)

Same 120-component graph (`tools/gen-components.js`), one cold production build
each, peak RSS via `/usr/bin/time -v`. `tools/mem-compare.sh production`.

| engine    | builder                          | peak RSS | wall  |
|-----------|----------------------------------|----------|-------|
| puglite   | webpack (`puglite:browser`)      | 1645 MB  | 17.9s |
| webdiscus | webpack (custom-webpack)         | 1498 MB  | 20.0s |
| esbuild   | stock `@angular/build:application` (HTML twin, no pug) | **1122 MB** | **6.0s** |

- **Builder cost:** webpack path is **+45% RAM and ~3× slower** than stock
  esbuild on an identical component graph (HTML templates instead of pug).
- **Loader cost:** puglite vs webdiscus differ by ~150 MB one run, −9 MB
  another — within RSS run-to-run noise. Swapping pug loaders does not recover
  the memory.

The esbuild row uses a separate HTML-only entry (`main-esbuild.ts` →
`generated-html/`) because the stock builder has no `.pug` handler: pug loaders
must run as a webpack loader *before* Angular's AOT template validation, and
esbuild's plugin phase runs too late. So any pug-on-Angular setup is locked to
webpack, and that lock — not puglite — is the source of the higher memory seen
when migrating a real app off the esbuild builder.
