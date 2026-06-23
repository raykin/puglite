# Angular Puglite Demo

Demo of using Puglite templates with Angular 20.

## Setup

```bash
cd angular-puglite-demo
npm install
npm start
```

Open http://localhost:4200/

## Usage

### angular.json

```json
{
  "build": {
    "builder": "puglite:browser"
  },
  "serve": {
    "builder": "puglite:dev-server"
  }
}
```

### Component

```typescript
@Component({
  selector: 'app-root',
  templateUrl: 'hello.pug'
})
export class App {}
```

### Template (hello.pug)

```pug
.container
  h1 Hello from Puglite!
  ul
    li Clean syntax
    li Compiled at build time
    li Works with Angular 20
```

## Requirements

- Node.js 18+
- Angular 20+
- `@angular-builders/custom-webpack` (peer dependency of puglite)
