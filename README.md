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

**Perfect for:** Declarative templates where logic belongs in application code.

## Credits & Thanks

**Puglite is built upon [Pug](https://pugjs.org).** All core parsing and compilation code comes from the excellent Pug project. We simply removed features to create a more focused template engine.

Huge thanks to:
- **TJ Holowaychuk** - Pug creator
- **Forbes Lindesay** - Pug maintainer
- **The Pug.js team and all contributors**

Without their amazing work, Puglite wouldn't exist. ❤️

## Quick Start with Angular 20+

### 1. Install
```bash
npm install --save-dev @angular-builders/custom-webpack
```

### 2. Create `custom-webpack.config.js`
```javascript
module.exports = require('puglite/packages/angular-webpack')();
```

### 3. Update `angular.json`
```json
{
  "builder": "@angular-builders/custom-webpack:browser",
  "options": {
    "customWebpackConfig": { "path": "./custom-webpack.config.js" }
  }
}
```

### 4. Use `.pug` Templates
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

```pug
// Tags
div
span
p

// Classes and IDs
.my-class
#my-id
div.class1.class2#id

// Attributes
a(href="/home" target="_blank")
input(type="text" value="Hello")

// Text
p This is text
div.
  Multiple lines
  of text

// Nesting
.container
  .header
    h1 Title
  .content
    p Content
```

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
<!-- VERSION_TABLE -->
Package Name | Version
-------------|--------
@puglite/angular-webpack | [![NPM version](https://img.shields.io/npm/v/@puglite/angular-webpack?style=for-the-badge)](https://www.npmjs.com/package/@puglite/angular-webpack)
puglite | [![NPM version](https://img.shields.io/npm/v/puglite?style=for-the-badge)](https://www.npmjs.com/package/puglite)
<!-- VERSION_TABLE -->