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
