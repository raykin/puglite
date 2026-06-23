# Puglite Vitest Builder

Angular builder that runs Vitest with Pug template support.

## Usage

In `angular.json`:

```json
{
  "architect": {
    "test": {
      "builder": "puglite:vitest",
      "options": {}
    }
  }
}
```

Run tests:

```bash
ng test                  # Run all tests via builder
npx vitest <file>       # Run specific test file directly
```

## How It Works

The builder:
1. Calls Vitest's `startVitest()` API directly
2. Injects a Vite plugin to transform `.pug` files to HTML strings
3. Enables `jsdom` environment for browser API support (localStorage, window, etc.)

## Important: You Probably Don't Need Pug Plugin for Tests

**Best practice:** Test component logic only, without importing templates.

```typescript
// ✅ Test component logic only - NO template imports needed
describe('UploadImgComponent', () => {
  let component: UploadImgComponent;

  beforeEach(() => {
    const mockService = { upload: vi.fn() };
    component = new UploadImgComponent(mockService);  // No TestBed
  });

  it('should update state', () => {
    component.uploadState.set({ status: 'uploading', progress: 50 });
    expect(component.isUploading()).toBe(true);
  });
});
```

**Template/UI testing happens in E2E:**

```typescript
// e2e/upload.spec.ts
test('should display upload progress', async ({ page }) => {
  await page.goto('/upload');
  await expect(page.locator('.progress')).toHaveText('50%');
});
```

## When You DO Need Pug Plugin

Only if you want to import pug templates in tests (NOT recommended):

```typescript
import template from './component.pug';  // ← Requires pug plugin

@Component({
  selector: 'app-test',
  template: template,  // Inline template from import
})
class TestComponent extends RealComponent {}

TestBed.configureTestingModule({ imports: [TestComponent] })
```

**Why NOT recommended:**
- Still requires TestBed (complex setup)
- Adds unnecessary complexity
- Better separation: logic in Vitest, UI in E2E

## Pug Template Support (Advanced)

If you still want to import pug files in tests, the builder's plugin supports it.

**✅ Works:** Import pug files as ES modules

```typescript
import template from './component.pug';

@Component({
  selector: 'app-test',
  template: template,  // Inline template from import
})
class TestComponent extends RealComponent {}
```

**❌ Doesn't work:** TestBed with external templateUrl

```typescript
// This will FAIL in Vitest
@Component({
  templateUrl: './component.pug'  // External template
})
class RealComponent {}

TestBed.configureTestingModule({ imports: [RealComponent] })
  .compileComponents();  // Error: Component not resolved
```

See `angular-puglite-demo/src/app/app-templateurl.spec.ts` for a concrete example.

## TestBed Limitation

**TestBed does NOT work with external templates (`.pug` or `.html`) in Vitest.**

### Why?

- **TestBed's `compileComponents()`** expects to **fetch** external templates like a browser (HTTP requests)
- **Vitest** runs in Node.js with **no dev server** (unlike Karma which runs in real browser)
- **Vite plugins** transform ES module **imports** (`import x from 'file.pug'`), but TestBed uses file path strings (`templateUrl: 'file.pug'`)
- These are two different systems that never connect

### Recommended Patterns

**Don't use TestBed in Vitest.** Follow these patterns:

#### 1. Service Tests (✅ Recommended)

```typescript
describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    const httpMock = { get: vi.fn(), post: vi.fn() };
    service = new MyService(httpMock);  // Manual instantiation
  });

  it('should fetch data', () => {
    // Test service logic
  });
});
```

#### 2. Component Logic Tests (✅ Recommended)

```typescript
describe('MyComponent', () => {
  let component: MyComponent;

  beforeEach(() => {
    const mockService = { getData: vi.fn() };
    component = new MyComponent(mockService);  // No TestBed
  });

  it('should update state', () => {
    // Test component methods, signals, computed values
    expect(component.items()).toEqual([]);
  });
});
```

#### 3. Template/UI Tests (✅ Use E2E)

```typescript
// e2e/my-component.spec.ts (Playwright)
test('should display items', async ({ page }) => {
  await page.goto('/my-component');
  await expect(page.locator('.item')).toBeVisible();
});
```

## Alternative: Use Vitest Directly

Instead of using this builder, you can run Vitest directly:

**package.json:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test-setup.ts']
  }
});
```

**No pug plugin needed** - just test component logic with `new Component()`.

## Summary

| What | Vitest (logic) | E2E (Playwright) |
|------|----------------|------------------|
| Service logic | ✅ `new Service()` | ❌ |
| Component logic | ✅ `new Component()` | ❌ |
| Template rendering | ❌ | ✅ |
| User interactions | ❌ | ✅ |
| DOM assertions | ❌ | ✅ |
| Pug plugin needed | ❌ No | N/A |

**Recommended: Use Vitest for logic, E2E for UI. No pug plugin needed.**
