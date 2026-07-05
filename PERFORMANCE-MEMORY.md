# Puglite Performance Notes

Research results on the webpack loader's build cost. Conclusion up front:
**the webpack-vs-esbuild builder, not pug compilation, drives the memory/time
cost.** Swapping pug loaders does not recover the memory.

## Context

Migrating a real Angular app (Angular 21, several hundred `.pug` templates)
from `ngx-pug-builders` to `puglite` made cold builds noticeably slower — a
cold build (after deleting `.angular/cache`) took ~30s and regenerated a
multi-GB `.angular/cache`. The findings below explain why, and why the cause
is not puglite's compiler.

## Findings

- **Two cache layers.** (1) `.angular/cache` is webpack's persistent
  filesystem cache — Angular's webpack builder always writes it, and webpack-5
  loaders are cacheable by default, so it already caches puglite's loader
  output (the multi-GB directory). (2) A loader-internal `source → html` memo
  would not help: each `.pug` is its own module, so the same source string is
  never compiled twice in a run.
- **Warm builds are equal.** With cache present, unchanged `.pug` files are
  served from `.angular/cache`, not recompiled — no puglite-specific slowdown
  vs `ngx-pug-builders`.
- **The builders are not the cause.** `builders/browser` and
  `builders/dev-server` are functionally equivalent to `ngx-pug-builders`
  (both wrap `@angular-builders/custom-webpack` + one `.pug` webpack rule).
- **The compiler is in the noise.** Cold builds compile each `.pug` once via
  puglite's pure-JS pipeline (`lexer → parser → strip-comments → code-gen →
  runtime-wrap`); measurement showed this is not the lever (below).

## Measured results (2026-06)

Two suites were built and run. Both point to the same conclusion.

### 1. Isolated compiler bench (`bench/`)

Each engine in its own Node process, same options
(`{ cache:false, compileDebug:false, pretty:false, inlineRuntimeFunctions:false }`),
corpus of small/medium/deep/attrs/large fixtures.

| engine    | compile | peak RSS | peak heap |
|-----------|---------|----------|-----------|
| puglite   | 128 ms  | 220 MB   | 88 MB     |
| pug       | 162 ms  | 236 MB   | 102 MB    |
| webdiscus | 160 ms  | 234 MB   | 102 MB    |

puglite's compiler is ~20% faster and slightly lighter than stock pug — it did
**not** strip optimizations that would make it heavier.

### 2. Real Angular app, 3-way cold build

Same 120-component graph, one cold production build each, peak RSS via
`/usr/bin/time -v`.

| engine    | builder                          | peak RSS | wall  |
|-----------|----------------------------------|----------|-------|
| puglite   | webpack (`puglite:browser`)      | 1645 MB  | 17.9s |
| webdiscus | webpack (custom-webpack)         | 1498 MB  | 20.0s |
| esbuild   | stock `@angular/build:application` (HTML twin, no pug) | **1122 MB** | **6.0s** |

- **Builder cost:** webpack path is **+45% RAM and ~3× slower** than stock
  esbuild on an identical component graph (HTML templates instead of pug).
- **Loader cost:** puglite vs webdiscus differ by ~150 MB one run, −9 MB
  another — within RSS run-to-run noise.

The esbuild row used a separate HTML-only entry because the stock builder has
no `.pug` handler: pug loaders must run as a webpack loader *before* Angular's
AOT template validation, and esbuild's plugin phase runs too late. So any
pug-on-Angular setup is locked to webpack, and that lock — not puglite — is the
source of the higher memory seen when migrating a real app off the esbuild
builder.
