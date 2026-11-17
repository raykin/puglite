# Puglite — Backlog

Spec source of truth: **EXAMPLES.md**. Treat it as the feature contract — no "Pug minus X" framing.

Demo layout: `src/app/{showcase,esbuild,features}/`. Loader-integration claims must be verified under karma (`npm run test:karma`) — vitest uses a mock loader (`vitest-pug-plugin.ts`), not the real webpack loader.

Pretty-printing (`pretty` option) is a **kept, supported feature** — do not propose removing it.

Esbuild builder gotchas: the outputPath object variant in a builder schema MUST declare browser/server/media defaults — architect fills schema defaults and Angular's normalizer relies on them (undefined `server` crashes deleteOutputDir). The fs patch depends on TS reading resources via `fs.readFileSync`, which may change on Angular/TS upgrades. `puglite:vitest` only transforms `.pug` imports, not `templateUrl` — karma remains the only real-loader test path.

---

## Low priority
