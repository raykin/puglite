# Puglite Angular Integration

Use Puglite templates in Angular 20+ projects.

## Installation

```bash
npm install puglite
```

## Quick Start (Recommended)

The simplest way to use Puglite with Angular is using the **built-in builders**:

### 1. Update `angular.json`

Change your builders to use Puglite:

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "builder": "puglite:browser",
          "options": {
            "outputPath": "dist/your-app",
            "index": "src/index.html",
            "main": "src/main.ts",
            "tsConfig": "tsconfig.app.json",
            "assets": ["src/favicon.ico", "src/assets"],
            "styles": ["src/styles.css"]
          }
        },
        "serve": {
          "builder": "puglite:dev-server",
          "options": {
            "buildTarget": "your-app:build:development"
          }
        }
      }
    }
  }
}
```

### 2. Use Puglite Templates

That's it! Just use `.pug` files in your components:

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.pug',
  styleUrls: ['./app.component.css']
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
  ul
    li Feature 1
    li Feature 2
```

## Alternative: Custom Webpack Approach

If you need more control or already use custom webpack configurations:

### Installation

```bash
npm install puglite
npm install --save-dev @angular-builders/custom-webpack
```

**Note:** Match `@angular-builders/custom-webpack` version to your Angular version (Angular 20 → v20.x, Angular 21 → v21.x).

### Setup

**1. Update `angular.json`:**

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "builder": "@angular-builders/custom-webpack:browser",
          "options": {
            "customWebpackConfig": {
              "path": "./custom-webpack.config.js"
            },
            "outputPath": "dist/your-app",
            ...
          }
        },
        "serve": {
          "builder": "@angular-builders/custom-webpack:dev-server",
          "options": {
            "buildTarget": "your-app:build:development"
          }
        }
      }
    }
  }
}
```

**2. Create `custom-webpack.config.js`:**

```javascript
module.exports = require('puglite/angular-webpack')();
```

## Build and Serve

```bash
npm start       # Development server
npm run build   # Production build
```

## How It Works

### Built-in Builders (Recommended)

- `puglite:browser` - Wraps Angular's browser builder with Puglite support
- `puglite:dev-server` - Dev server with hot reload for `.pug` templates
- Zero configuration needed
- Auto-injects webpack loader for `.pug` files
- Uses Angular's official build system

### Custom Webpack Approach

- Uses `@angular-builders/custom-webpack` (1.5M downloads/month)
- Webpack loader intercepts `.pug` file imports during build
- Puglite compiles templates to HTML at build time
- Angular receives compiled HTML (no runtime overhead)

## TypeScript Support

Add type definitions for `.pug` imports:

**src/puglite.d.ts:**
```typescript
declare module '*.pug' {
  const content: string;
  export default content;
}
```

## Requirements

- Angular 18+
- Node.js 18+

## Comparison

| Feature | Built-in Builders | Custom Webpack |
|---------|------------------|----------------|
| Setup | Change builder name only | Need config file |
| Dependencies | None (just puglite) | Requires custom-webpack |
| Configuration | Zero-config | One line of config |
| Build Speed | Fast (Angular's esbuild) | Fast (webpack) |
| Customization | Standard Angular options | Full webpack control |

**Recommendation:** Use **built-in builders** for simplicity. Use **custom webpack** if you need advanced webpack configurations.

## Advanced Configuration

### With Built-in Builders

The builders automatically configure Puglite. All standard Angular build options work as expected.

### With Custom Webpack

Pass options to the Puglite webpack loader:

```javascript
// custom-webpack.config.js
module.exports = require('puglite/angular-webpack')({
  debug: true  // Enable debug mode
});
```

## Troubleshooting

### Templates showing raw pug syntax

**With built-in builders:**
1. Verify `"builder": "puglite:browser"` in angular.json
2. Clear cache: `rm -rf .angular dist`
3. Rebuild: `npm run build`

**With custom webpack:**
1. Verify `custom-webpack.config.js` exists and is correctly configured
2. Check `angular.json` points to the config file
3. Ensure puglite is installed

### Build errors

- Clear the cache: `rm -rf .angular dist node_modules/.cache`
- Reinstall dependencies: `npm install`
- Make sure Angular and puglite versions are compatible

## What is Puglite?

Puglite is a lightweight implementation of Pug templates:
- ✅ Clean whitespace-sensitive syntax
- ✅ No mixins (simplified)
- ✅ No logic flow (templates stay declarative)
- ✅ No interpolation (use Angular expressions)
- ✅ Perfect for static component templates

## License

MIT
