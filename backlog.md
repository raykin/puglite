# Puglite — Backlog

Spec source of truth: **EXAMPLES.md**. Treat it as the feature contract — no "Pug minus X" framing.

Demo layout: `src/app/{showcase,esbuild,features}/`. Loader-integration claims must be verified under karma (`npm run test:karma`) — vitest uses a mock loader (`vitest-pug-plugin.ts`), not the real webpack loader.

Pretty-printing (`pretty` option) is a **kept, supported feature** — do not propose removing it.

---

## Refactor: Kasa — replace webpack with esbuild

`~/code/kasa/angular.json` still builds with `puglite:browser` and `puglite:dev-server` (webpack). Kasa installs `puglite` ^1.2.0 from npm, which has no esbuild builders, so this waits on the release below.

- Switch `build` to `puglite:application` and `serve` to `puglite:application-dev-server`. Remove `@angular-builders/*`.
- Use flat `outputPath` `{base: "www", browser: ""}` (capacitor `webDir`, purgecss `www/**/*.css`, `shells/sync_version.js` `www/ngsw.json` all assume flat `www`), then re-verify build scripts against `www`.
- android/ios capacitor sync against the new `www`.
- `extract-i18n` points at `app:build`. Test it after the switch.

Keep kasa's `ci` build configuration: the playwright e2e webServer runs `npm start -- --configuration ci`.

## TechPlan: Puglite — release esbuild builders

`puglite:application` + `application-dev-server` are implemented, tested (`test/application-builder.test.js`), demo-wired (`build-application`/`serve-application`), but unreleased. Publish a new version (needs `@angular/build` optional peerDep — already in package.json), then update kasa to the released package.

Durable gotchas (keep): outputPath object variant in a builder schema MUST declare browser/server/media defaults — architect fills schema defaults and Angular's normalizer relies on them (undefined `server` crashes deleteOutputDir). fs-patch depends on TS reading resources via `fs.readFileSync` (implementation detail, may shift on Angular/TS upgrades). `puglite:vitest` only transforms `.pug` imports, not `templateUrl` — karma remains the only real-loader test path.

## Low priority

## Refactor: Puglite — fold `strip-comments.js` into the parser

Optional. `lib/compile-html.js` runs `lib/strip-comments.js` as its own pass over the tokens between the lexer and `lib/parser.js`. Move comment stripping into the parser. `test/builder-pipeline.test.js` snapshots the builder output for every case with `pretty: false` and `true` and must stay green. Run `npm test`, `npx jest test/application-builder.test.js` and `cd angular-puglite-demo && npm run test:karma` after the change.
