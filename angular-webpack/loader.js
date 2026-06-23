/**
 * Webpack loader for Puglite templates
 * Compiles .pug files to HTML at build time
 */

const lex = require('../lib/lexer');
const parse = require('../lib/parser');
const generateCode = require('../lib/code-gen');
const stripComments = require('../lib/strip-comments');
const runtimeWrap = require('../lib/runtime-wrap');

module.exports = function pugliteLoader(source) {
  if (this.cacheable) this.cacheable(true);
  const filename = this.resourcePath;

  try {
    // Compile: lex → parse → generate → wrap → execute
    const tokens = lex(source, { filename });
    const strippedTokens = stripComments(tokens, { filename });
    const ast = parse(strippedTokens, { filename, src: source });
    const js = generateCode(ast, {
      compileDebug: false,
      pretty: false,
      inlineRuntimeFunctions: false,
      templateName: 'template'
    });
    const templateFn = runtimeWrap(js);
    const html = templateFn({});

    // Return as CommonJS module
    return `module.exports = ${JSON.stringify(html)};`;

  } catch (error) {
    // Fail the module build hard. Returning an empty module here would render
    // a silently blank component and let the build "succeed" — surface the
    // real error instead.
    error.message = `Puglite compilation failed for ${filename}: ${error.message}`;
    throw error;
  }
};
