/**
 * Webpack loader for Puglite templates
 * Compiles .pug files to HTML at build time
 */

module.exports = function pugliteLoader(source) {
  const filename = this.resourcePath;

  try {
    // Import puglite internal modules
    const lex = require('../pug/lib/lexer');
    const parse = require('../pug/lib/parser');
    const generateCode = require('../pug/lib/code-gen');
    const stripComments = require('../pug/lib/strip-comments');
    const runtimeWrap = require('../pug/lib/runtime-wrap');

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
    const html = templateFn();

    // Return as CommonJS module
    return `module.exports = ${JSON.stringify(html)};`;

  } catch (error) {
    this.emitError(new Error(`Puglite compilation failed for ${filename}: ${error.message}`));
    return `module.exports = "";`;
  }
};
