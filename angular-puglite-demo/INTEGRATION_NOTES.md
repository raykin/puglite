# Angular + Puglite Integration Notes

## Goal

Integrate puglite template compilation with Angular 20 build system using esbuild/Vite plugins for compile-time template transformation.

## What We Tried

### 1. esbuild Plugin (@angular-builders/custom-esbuild)

- **Approach**: Created esbuild plugin to transform `.pug` files
- **Result**: ❌ Failed
- **Reason**: esbuild plugins run during JavaScript bundling phase, AFTER Angular's compiler has already validated templates

### 2. Vite Plugin

- **Approach**: Created Vite plugin for dev server
- **Result**: ❌ Failed
- **Reason**: Vite plugins only work for dev server (not production builds), and still run after Angular's template validation

### 3. TypeScript File Transformation

- **Approach**: Transform `.ts` files to inline compiled templates before Angular processes them
- **Result**: ❌ Failed
- **Reason**: esbuild plugins can't intercept files early enough in Angular's compilation pipeline

## The Fundamental Conflict

**Angular 20 Build Pipeline:**

```
1. Angular Compiler (validates & processes templates) ← Templates must be valid HERE
2. TypeScript Compilation
3. esbuild/Vite Bundling (plugins run here) ← Too late!
```

**The Problem:**

- Angular's compiler validates `templateUrl` references and `template` values during step 1
- All esbuild/Vite plugins run during step 3
- By the time plugins can transform `.pug` files, Angular has already:
  - Failed validation (if using `import template from './file.pug'`)
  - Or loaded raw `.pug` content (if using `templateUrl: './file.pug'`)

## Current Working Solutions

1. **Pre-compilation script**: Compile `.pug` → `.html` before Angular build starts
2. **File watcher**: Continuously compile `.pug` → `.html` during development
3. **Inline templates**: Write templates as template strings in TypeScript

## What Would Need to Change

For esbuild/Vite plugin integration to work, one of these would be needed:

### Option A: Angular Builder Changes

- Angular's build system would need to expose hooks BEFORE template validation
- Allow plugins to transform files during Angular's compilation phase (step 1)

### Option B: esbuild/Vite Architecture Changes

- esbuild would need to support "pre-compilation" plugins that run before TypeScript compilation
- Vite would need similar early-phase transformation hooks

### Option C: Angular Template Loader API

- Angular could provide a custom template loader API
- Allow registering custom handlers for file extensions (e.g., `.pug`)
- Similar to webpack's loader system but at the Angular compiler level

## Files Created During Investigation

- `/esbuild-puglite-plugin.js` - esbuild plugin (doesn't work)
- `/vite-plugin-puglite.js` - Vite plugin (doesn't work)
- `angular-puglite-demo/vite.config.ts` - Vite configuration
- `angular-puglite-demo/src/puglite.d.ts` - TypeScript declarations for `.pug` imports

## Conclusion

**Current Status**: Impossible to integrate puglite with Angular 20 using esbuild/Vite plugins alone.

**Future**: May become possible if Angular or esbuild/Vite expose earlier compilation hooks.

**Date**: 2025-12-09
**Angular Version**: 20.0.0
**esbuild Version**: (via @angular/build)

## Re-verification (2026-07-11, Angular 21.1, @angular-builders/custom-esbuild 21)

Tested two claims against the `build-custom-esbuild` target (`esbuild/pug-plugin.js`, `esbuild/pug-ts-transform-plugin.js`):

1. **Naive `.pug` onResolve/onLoad plugin** (as suggested by AI search results): plugin never fires (`resolved: 0, loaded: 0`). Angular's compiler reads `templateUrl` resources from disk itself; the raw pug source ends up in the bundle as the "template".
2. **TS-source transform** (angular-builders#1905, reported working Feb 2025): `onResolve` fires but the namespaced `onLoad` never runs. `@angular/build` pushes its compiler plugin before user plugins (`application-code-bundle.js` — compiler plugin at push site, `options.plugins` appended after), and esbuild gives the first-registered `onLoad` priority. User plugins cannot pre-transform component TS on this version.

Conclusion stands: custom-esbuild plugins alone cannot integrate pug on current Angular — via the plugin API.

3. **fs interception** (`esbuild/pug-fs-intercept-plugin.js`, `esbuild/pug-fs-preload.js`): ✅ **works**. The AOT resource loader ends at TypeScript's `readFile`, which calls `fs.readFileSync` with no encoding (returns a `Buffer` — string-only patches miss it silently). Patching `fs.readFileSync` to compile `.pug` → HTML makes `templateUrl: './x.pug'` build correctly, including AOT template compilation (verified: compiled `<h1>` HTML in the bundle, not raw pug).
   - Plugin-only variant: works with `NG_BUILD_PARALLEL_TS=0` (compilation must run in the main thread where the plugin patched `fs`).
   - Preload variant (`NODE_OPTIONS="--require .../pug-fs-preload.js"`): works in default parallel mode — worker threads inherit `--require`, so every compilation thread gets the patch.
   - Caveats: no watch-dependency tracking on `.pug` files, diagnostics map to compiled HTML, depends on TS reading resources via `fs.readFileSync` (implementation detail, may break on Angular/TS upgrades).
