# Puglite — Next Session Backlog

Follow-up work deferred from the lib dead-code removal pass (groups 1–5 already landed: dynamic-tag `#{}`, code blocks, block/append/prepend/yield/mixin-block, inline tag interp `#[]`, text code interp `!{}` — all now literal/rejected; 188 jest + 16 demo green).

Spec source of truth: **EXAMPLES.md**. Treat it as the feature contract — no "Pug minus X" framing.

Demo layout: `src/app/{showcase,esbuild,features}/`. Loader-integration claims must be verified under karma (`npm run test:karma`) — vitest uses a mock loader (`vitest-pug-plugin.ts`), not the real webpack loader.

---

## 1. Remove dead vars (trivial, zero-risk)

- `lib/code-gen.js`: `this.eachCount` (Compiler ctor), `this.parentIndents`, unused entries in `INTERNAL_VARIABLES` (`pug_interp` and `pug_debug_*` are only needed under `compileDebug`).
- Sweep for other now-unused fields after groups 1–5.
- Verify: `npx jest`.

## 2. Remove plugin hooks (clean; not publicly exposed)

- `lib/lexer.js`: plugin loop in `callLexerFunction` (iterates `this.plugins`); drop `this.plugins`.
- `lib/parser.js`: `runPlugin()` + every `default`-branch `runPlugin(...)` call (parseExpr, parseText, parseTextHtml, parseTextBlock, tag attr/text switches).
- `lib/index.js` / builders: check nothing passes `options.plugins`.
- Verify: `npx jest` + demo vitest.

## 3. Remove pretty-printing (bigger — touches test fixtures)

- `lib/code-gen.js`: `pp`/`prettyIndent()`, `WHITE_SPACE_SENSITIVE_TAGS`, `tagCanInline()`, `pug_indent`, `escapePrettyMode`, the `pretty` option and its validation in the Compiler ctor.
- **Blocker:** `test/run.test.js` fixtures `test/cases/text.*` and `test/cases/pre.*` render with `pretty:true`. Removing pretty means regenerating/rewriting those `.html` expectations (or dropping the pretty variants).
- Decide first whether `pretty` should stay as a supported option. EXAMPLES.md doesn't mention it, but it's output formatting, not syntax. **Hold until explicitly decided.**

---

Suggested order: 1 → 2, then decide on 3.
