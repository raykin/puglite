# Low priority backlog

## Refactor: Puglite — fold `strip-comments.js` into the parser

Optional. `lib/compile-html.js` runs `lib/strip-comments.js` as its own pass over the tokens between the lexer and `lib/parser.js`. Move comment stripping into the parser. `test/builder-pipeline.test.js` snapshots the builder output for every case with `pretty: false` and `true` and must stay green. Run `npm test`, `npx jest test/application-builder.test.js` and `cd angular-puglite-demo && npm run test:karma` after the change.
