# Angular Puglite Demo

This is a working demo of using **Puglite** templates with **Angular 20**.

## What This Demo Shows

- ✅ Using `.pug` files as Angular component templates
- ✅ Integration with Angular 20's esbuild-based build system
- ✅ Custom esbuild plugin that compiles Puglite templates at build time
- ✅ TypeScript support for `.pug` imports
- ✅ Works with both `ng build` and `ng serve` (dev server with HMR)

## Project Structure

```
angular-puglite-demo/
├── src/
│   ├── app/
│   │   ├── app.ts              # Angular component using Puglite template
│   │   └── hello.pug           # Puglite template file
│   └── puglite.d.ts            # TypeScript declarations for .pug files
├── angular.json                # Configured to use custom esbuild builder
└── package.json                # Angular 20 dependencies
```

## Key Configuration

### 1. Component Usage

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'hello.pug',  // Use .pug file as template
  styles: [`/* your styles */`]
})
export class App {}
```

**Important:** Use `templateUrl` instead of `template` with an import. Angular's compiler processes `templateUrl` differently, allowing esbuild to transform the .pug file first.

### 2. angular.json Configuration

```json
{
  "build": {
    "builder": "@angular-builders/custom-esbuild:application",
    "options": {
      "plugins": [
        "../esbuild-puglite-plugin.js"
      ]
    }
  }
}
```

### 3. Puglite ESBuild Plugin

Located at `/home/raykin/studio/puglite/esbuild-puglite-plugin.js`, this plugin:
- Intercepts `.pug` file imports
- Compiles them using Puglite (lex → parse → codegen → runtime)
- Returns the compiled HTML as a JavaScript module

## Running the Demo

### Install Dependencies
```bash
cd angular-puglite-demo
npm install
```

### Development Server
```bash
npm start
```
Open http://localhost:4200/ to see the app.

### Production Build
```bash
npm run build
```
Output will be in `dist/angular-puglite-demo/`

## How It Works

1. **TypeScript Declaration**: `puglite.d.ts` tells TypeScript that `.pug` files export strings
2. **Custom Builder**: `@angular-builders/custom-esbuild` allows custom esbuild plugins
3. **Puglite Plugin**: Transforms `.pug` files to HTML at build time
4. **Angular Integration**: Uses `templateUrl` to reference `.pug` files

## Requirements

- Node.js 18+
- Angular 20 (Angular 21 support requires updated @angular-builders/custom-esbuild)
- TypeScript 5.8+

## Puglite vs Standard Pug

This demo uses **Puglite**, a lightweight implementation that:
- ✅ No mixins
- ✅ No logic flow (if/else/for)
- ✅ No interpolation
- ✅ Focused on clean HTML generation
- ✅ Perfect for static Angular templates

## Example Template

**hello.pug:**
```pug
.hello-container
  h1 Hello from Puglite!
  p This template was compiled using puglite
  .features
    h2 Features:
    ul
      li Clean whitespace-sensitive syntax
      li Compiled at build time
      li Works with Angular 20
      li Uses local puglite library
```

Compiles to clean HTML that Angular uses as the component template.

## Notes

- The esbuild plugin is located in the parent `/puglite` directory as a shared resource
- Both `templateUrl: './hello.pug'` and `templateUrl: 'hello.pug'` work
- Changes to `.pug` files trigger hot reloading in dev mode
- The plugin can be published as a separate npm package for easier reuse
