# Puglite Karma Test Builder

Karma test runner with Puglite (`.pug`) template support for Angular projects.

## Usage

Update your `angular.json` to use the puglite karma builder:

```json
{
  "projects": {
    "your-project": {
      "architect": {
        "test": {
          "builder": "puglite:karma",
          "options": {
            "karmaConfig": "karma.conf.js",
            "main": "src/test.ts",
            "polyfills": ["zone.js", "zone.js/testing"],
            "tsConfig": "tsconfig.spec.json",
            "assets": ["src/favicon.ico", "src/assets"],
            "styles": ["src/styles.scss"],
            "scripts": []
          }
        }
      }
    }
  }
}
```

## Features

- ✅ Automatic `.pug` template loading via webpack
- ✅ Works with existing Karma configuration
- ✅ Full Angular CLI test options support
- ✅ Code coverage support
- ✅ Watch mode support

## How It Works

The builder wraps Angular's standard Karma builder and injects webpack configuration to handle `.pug` templates using the puglite loader. This allows you to:

1. Use `.pug` files as Angular component templates
2. Run unit tests with Karma/Jasmine
3. Test components that use `.pug` templates

## Example Component

```typescript
@Component({
  selector: 'app-example',
  templateUrl: './example.component.pug',
  styleUrls: ['./example.component.scss']
})
export class ExampleComponent {}
```

```pug
// example.component.pug
.container
  h1 Hello World
  p This is a pug template
```

## Running Tests

```bash
ng test
```

Or with code coverage:

```bash
ng test --code-coverage
```

## Requirements

- Angular 18+
- Karma
- `@angular-builders/custom-webpack` (peer dependency)
