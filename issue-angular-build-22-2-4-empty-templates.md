# @angular/build 22.2.4+ compiles every `.pug` template to an empty template

## Symptom

With `puglite:application` (esbuild) on `@angular/build` 22.2.4 or later, every
component whose `templateUrl` points to a `.pug` file is compiled with an empty
template. The build exits 0 and prints no puglite error. The app then renders
blank pages.

Found in the kasa app (`~/code/kasa`) on @angular/build 22.2.7:

- All 68 components in `www/*.js` compiled with `decls: 0` and `template: ""`.
- The compiler printed many `NG8113: X is not used within the template of Y`
  warnings. The template was empty, so every import looked unused.
- Pinning `@angular/build` to exactly `22.2.3` fixed it: 68 of 68 components
  had non-empty templates again. kasa is pinned there until puglite is fixed.

## Cause

angular-cli commit `5691298d0` ("perf(@angular/build): avoid reading external
component stylesheets twice") shipped in v22.2.4. It changed `host.readResource`
in `packages/angular/build/src/tools/angular/angular-host.ts`.

22.2.3 (works):

```js
host.readResource = async function (filename) {
    return this.readFile(filename) ?? '';
};
```

22.2.4+ (breaks puglite):

```js
host.readResource = async function (filename) {
    if (!hasTemplateExtension(filename)) {
        return '';
    }
    return this.readFile(filename) ?? '';
};
// ...
const TEMPLATE_EXTENSIONS = new Set(['.htm', '.html', '.svg']);
```

`.pug` is not in `TEMPLATE_EXTENSIONS`, so `readResource` returns `''` and never
calls `readFile`. puglite's esbuild path (`builders/application/fs-intercept.js`)
works by patching `fs.readFileSync` / `fs.promises.readFile` so a `.pug` read
returns compiled HTML. That read no longer happens. No compile runs, no error
reaches `stats.errors`, and `failOnPugErrors` lets the build pass.

`TEMPLATE_EXTENSIONS` is a module-level constant and there is no option or
env var to extend it. A config change in the app cannot fix this.

## Related code in the same file

`host.resourceNameToFileName` also uses `hasTemplateExtension`. This check is
older than 22.2.4 and also exists in 22.2.3:

```js
if (!hostOptions.externalStylesheets || hasTemplateExtension(resolvedPath)) {
    return resolvedPath;
}
// otherwise the resource is treated as an external stylesheet: `<hash>.css`
```

`externalStylesheets` is set when component style HMR is on (dev server). It
has not been checked whether `.pug` templates are mapped to `<hash>.css`
there. Check `puglite:application-dev-server` along with the build.

## Why puglite's tests did not catch it

- `test/application-builder.test.js` runs the builders against a stubbed
  `@angular/build`, so Angular's real compiler host never runs.
- `angular-puglite-demo/package.json` uses `@angular/build` `^21.1.0`.
- No test checks that the built output has a non-empty template.

## Reproduce

1. In any app using `puglite:application`, install `@angular/build@22.2.4` or
   newer.
2. Run `npx ng build`.
3. In `www/` (or `dist/`), find a component's `defineComponent({...})`. It has
   `decls: 0` and its `setClassMetadata` has `template: ""`.
4. Install `@angular/build@22.2.3` and rebuild. The templates come back.

## What the fix must cover

- `ng build` and `ng serve` (`puglite:application-dev-server`) on
  @angular/build 22.2.4 through the newest 22.x, and still on 18–22.2.3
  (`peerDependencies` says `>=18.0.0`).
- Watch-mode rebuilds after a `.pug` edit.
- A pug compile error must still fail the build.
- A test that builds with the real `@angular/build` (not the stub) and checks
  that a compiled template is non-empty.
