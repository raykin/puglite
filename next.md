# Puglite — Next Session Backlog

Spec source of truth: **EXAMPLES.md**. Treat it as the feature contract — no "Pug minus X" framing.

Demo layout: `src/app/{showcase,esbuild,features}/`. Loader-integration claims must be verified under karma (`npm run test:karma`) — vitest uses a mock loader (`vitest-pug-plugin.ts`), not the real webpack loader.

Pretty-printing (`pretty` option) is a **kept, supported feature** — do not propose removing it.

---

## Kasa: totally replace webpack with esbuild

Remaining (builder swap itself landed in kasa 2026-07-12, uncommitted; output still `www-esbuild`):

- Switch `outputPath` to flat `{base: "www", browser: ""}` (capacitor `webDir`, purgecss `www/**/*.css`, `shells/sync_version.js` `www/ngsw.json` all assume flat `www`), then re-verify build scripts against `www`.
- android/ios capacitor sync against the new `www`.
- `extract-i18n` still points at `app:build` (now the esbuild builder) — untested.
- Kasa still installs puglite via `npm i --no-save ~/studio/puglite` symlink — switch to a released version.

Notes: bare `npm run build` now uses defaultConfiguration `development` (assumption: matches old webpack dev defaults). `npm run lint` fails pre-existing (eslint 9 rejects legacy `.eslintrc.json`). Gotcha: `npm uninstall` in kasa replaces the puglite symlink with registry 1.2.0 — re-run `npm i --no-save ~/studio/puglite`.

## Puglite: release esbuild builders

`puglite:application` + `application-dev-server` are implemented, tested (`test/application-builder.test.js`), demo-wired (`build-application`/`serve-application`), but unreleased. Publish a new version (needs `@angular/build` optional peerDep — already in package.json), then update kasa to the released package.

Durable gotchas (keep): outputPath object variant in a builder schema MUST declare browser/server/media defaults — architect fills schema defaults and Angular's normalizer relies on them (undefined `server` crashes deleteOutputDir). fs-patch depends on TS reading resources via `fs.readFileSync` (implementation detail, may shift on Angular/TS upgrades). `puglite:vitest` only transforms `.pug` imports, not `templateUrl` — karma remains the only real-loader test path.
