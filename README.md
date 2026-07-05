# Puglite

A minimal, whitespace-sensitive template engine for compile-time markup transformation.

## What is Puglite?

Puglite turns terse, indentation-based templates into HTML — nothing more. It deliberately has no runtime logic:
- ✅ Clean whitespace-sensitive syntax
- ✅ Tags, classes, IDs, attributes
- ✅ Compile-time transformation
- ❌ No logic flow (if/else, loops)
- ❌ No mixins
- ❌ No interpolation

Logic, iteration, and data binding belong to your framework (e.g. Angular); Puglite only shapes the markup around them.

## Supported Syntax

Elements, nesting, classes/IDs, attributes, doctypes, comments, text blocks,
block expansion, self-closing tags, and namespaces. See
[EXAMPLES.md](./EXAMPLES.md) for the full supported/not-supported reference and
worked examples.

## Standalone Usage

```js
const puglite = require('puglite');

const html = puglite.render('.container\n  h1 Hello\n  p World');
// <div class="container"><h1>Hello</h1><p>World</p></div>
```

## Quick Start with Angular 18+

### 1. Install
```bash
npm install -D puglite @angular-builders/custom-webpack
```

### 2. Update `angular.json`

Only the `builder` values change — keep your existing `options`. Under `projects.<your-app>.architect`, swap the `build` and `serve` builders:

```diff
  "build": {
-   "builder": "@angular-devkit/build-angular:browser",
+   "builder": "puglite:browser",
    "options": { ... }
  },
  "serve": {
-   "builder": "@angular-devkit/build-angular:dev-server",
+   "builder": "puglite:dev-server",
    "options": { ... }
  }
```

**Important:** Puglite requires the **old Angular schema format** — your `build` options must use `main` (not `browser`) and `outputPath`. The newer esbuild schema is not supported because puglite builds via webpack.

### 3. Use `.pug` Templates
```typescript
@Component({
  selector: 'app-root',
  templateUrl: './app.component.pug'
})
export class AppComponent {
  title = 'My App';
}
```

**app.component.pug:**
```pug
.container
  h1 {{ title }}
  p Welcome to Puglite!
```

## Testing Components

Puglite transforms `.pug` templates at **build time** via a webpack loader. Unit
test runners (Vitest, Jest) do **not** run the Angular/webpack build, so they have
no way to resolve a `templateUrl: './foo.component.pug'`. This means:

- ❌ **`TestBed.createComponent()` fails** — Angular tries to load the `.pug`
  template, which the test runner can't compile (`Component … is not resolved` /
  template-not-found errors). The same applies to `.scss` `styleUrls`.
- ✅ **Manual instantiation works** — test the component as a plain class:

```typescript
// No TestBed, no template rendering — just the constructor + methods.
const component = new CounterComponent();

component.increment();
expect(component.count()).toBe(1);
```

Because `new Component(...)` never reads `templateUrl`, it sidesteps the build-time
loader entirely. Cover component **logic** (signals, state machines, event emits,
`ngOnDestroy` cleanup) this way; cover **rendered template/DOM behavior** with e2e
tests (Playwright/Cypress) instead.

> Tip: passing a test callback `(done) => …` is a no-op in Vitest 4 — the arg is the
> test context, not a `done` function. A test that schedules `setTimeout(() => expect(...))`
> and returns synchronously is marked green **before** the timer fires, so its
> assertions never run. Keep these specs synchronous (use `of(...)`/`throwError(...)`
> for observables) so expectations actually gate the result.

## License

MIT — see [LICENSE](./LICENSE).

Puglite is a fork of [Pug](https://github.com/pugjs/pug), which is also MIT
licensed (Copyright © 2009-2014 TJ Holowaychuk). The original Pug copyright and
license notice are retained in [LICENSE](./LICENSE) as required.

## Links

- **Examples**: [EXAMPLES.md](./EXAMPLES.md)
- **Custom Webpack builders**: [GitHub](https://github.com/just-jeb/angular-builders)

## Credits & Thanks

**Puglite is built upon [Pug](https://pugjs.org).** All core parsing and compilation code comes from the excellent Pug project. We simply removed features to create a more focused template engine. Puglite was forked from Pug 3.x at upstream commit [`32acfe8`](https://github.com/pugjs/pug/commit/32acfe8) (#3438).

Huge thanks to:
- **TJ Holowaychuk** - Pug creator
- **Forbes Lindesay** - Pug maintainer
- **The Pug.js team and all contributors**

Without their amazing work, Puglite wouldn't exist. ❤️

Special thanks to **Adam Miller** for sponsoring the Claude Code usage that helped build Puglite.
