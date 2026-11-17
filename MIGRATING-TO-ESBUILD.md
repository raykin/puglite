# Migrating a Real App from webpack to esbuild

A worked example: a production Ionic/Capacitor app moved from the webpack
builders (`puglite:browser`, `puglite:dev-server`) to the esbuild builders
(`puglite:application`, `puglite:application-dev-server`).

The app: Angular 22.0.7, Ionic 8, Capacitor 8, 115 `.pug` templates. Measured
on 2026-11-17 with puglite 2.0.0 and Node 24.18.

## Results

Same machine, same puglite version, one cold run each. Peak memory is the
largest single process (`/usr/bin/time -f %M`).

| Build                                 | webpack         | esbuild         |
| ------------------------------------- | --------------- | --------------- |
| `ng build --configuration production` | 70.1 s, 4.5 GB  | 12.9 s, 3.0 GB  |
| `ng build` (development)              | 19.9 s, 4.9 GB  | 7.2 s, 1.9 GB   |

`ng serve` on esbuild started in 4.6 s and used 1.77 GB in all: the Node
process at 1.33 GB plus two esbuild processes at 0.30 GB and 0.18 GB.
Editing a `.pug` file rebuilt in 2.7 s and pushed the update to the browser.

## `angular.json` changes

Only the `build` and `serve` targets change.

```diff
  "build": {
-   "builder": "puglite:browser",
+   "builder": "puglite:application",
    "options": {
-     "outputPath": "www",
+     "outputPath": {
+       "base": "www",
+       "browser": ""
+     },
      "index": "src/index.html",
-     "main": "src/main.ts",
-     "polyfills": "src/polyfills.ts",
+     "browser": "src/main.ts",
+     "polyfills": ["src/polyfills.ts"],
      ...
-     "aot": false,
-     "vendorChunk": true,
-     "buildOptimizer": false,
-     "serviceWorker": false,
-     "ngswConfigPath": "ngsw-config.json"
+     "serviceWorker": false
    },
    "configurations": {
      "production": {
        ...
-       "aot": true,
-       "vendorChunk": false,
-       "buildOptimizer": true,
-       "serviceWorker": true,
+       "serviceWorker": "ngsw-config.json",
        ...
      }
    }
  },
  "serve": {
-   "builder": "puglite:dev-server",
+   "builder": "puglite:application-dev-server",
    "options": {
      "buildTarget": "app:build"
    }
  }
```

What each change is for:

| webpack option                      | esbuild option                         | Why                                                                                                                         |
| ----------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `"outputPath": "www"`               | `{ "base": "www", "browser": "" }`     | esbuild writes to `www/browser/` by default. `"browser": ""` keeps the flat `www/` that Capacitor's `webDir` and other scripts expect. |
| `main`                              | `browser`                              | Renamed in the application schema.                                                                                          |
| `"polyfills": "src/polyfills.ts"`   | `["src/polyfills.ts"]`                 | The application schema takes a list.                                                                                        |
| `aot`                               | removed                                | `puglite:application` always builds with AOT.                                                                               |
| `vendorChunk`, `buildOptimizer`     | removed                                | webpack-only.                                                                                                               |
| `serviceWorker: true` + `ngswConfigPath` | `"serviceWorker": "ngsw-config.json"` | The application schema takes the config path directly.                                                                  |

Nothing in the `.pug` templates or component code changed.

## Checks

- The development build has no warnings. The production build only warns
  about CommonJS modules (such as `mux.js` and `spark-md5`).
- The production build writes `www/ngsw.json`.
- The bundle holds compiled templates, not raw pug.
- Pages rendered in the dev server with 0 console errors.

`extract-i18n` and `cap sync` were not run in this test.
