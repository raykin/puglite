# Puglite

A lightweight, streamlined version of the Pug template engine.

## What is Puglite?

Puglite is a refactored version of [Pug](https://github.com/pugjs/pug) with simplified features:
- ✅ Clean whitespace-sensitive syntax
- ✅ Tags, classes, IDs, attributes
- ✅ Compile-time transformation
- ❌ No logic flow (if/else, loops)
- ❌ No mixins
- ❌ No interpolation

## Credits & Thanks

**Puglite is built upon [Pug](https://pugjs.org).** All core parsing and compilation code comes from the excellent Pug project. We simply removed features to create a more focused template engine.

Huge thanks to:
- **TJ Holowaychuk** - Pug creator
- **Forbes Lindesay** - Pug maintainer
- **The Pug.js team and all contributors**

Without their amazing work, Puglite wouldn't exist. ❤️

## Quick Start with Angular 18+

### 1. Install
```bash
npm install -D puglite @angular-builders/custom-webpack
```

### 2. Update `angular.json`

Use `puglite:browser` and `puglite:dev-server` builders:

```json
{
  "architect": {
    "build": {
      "builder": "puglite:browser",
      "options": {
        "outputPath": "dist/my-app",
        "index": "src/index.html",
        "main": "src/main.ts",
        "tsConfig": "tsconfig.app.json"
      }
    },
    "serve": {
      "builder": "puglite:dev-server",
      "configurations": {
        "development": {
          "buildTarget": "my-app:build:development"
        }
      }
    }
  }
}
```

**Important:** Puglite requires the **old Angular schema format** with `outputPath`, `index`, and `main`. The new Angular 17+ schema using `browser` instead of `main` is not supported because puglite uses webpack-based builds.

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

## Supported Syntax

See EXAMPLES.md

## What's Different from Pug?

Puglite **removes** these Pug features:
- ❌ Logic: `if`, `else`, `unless`, `case`, `when`
- ❌ Loops: `each`, `while`
- ❌ Mixins: `mixin`, `+mixin()`
- ❌ Interpolation: `#{}`, `!{}`

## Why Custom Webpack?

Angular 17+ uses esbuild for speed, but esbuild plugins run **after** template validation. Custom-webpack (1.5M downloads/month) uses webpack loaders that transform templates **before** Angular processes them - the only reliable way for compile-time template transformation.

## License

MIT

## Links

- **Pug**: [pugjs.org](https://pugjs.org) | [GitHub](https://github.com/pugjs/pug)
- **Custom Webpack**: [GitHub](https://github.com/just-jeb/angular-builders)
