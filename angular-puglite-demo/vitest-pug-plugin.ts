import { Plugin } from 'vite';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Vitest plugin to transform .pug files to HTML strings
 * This mimics what the webpack loader does during the actual build
 */
export function vitestPugPlugin(): Plugin {
  return {
    name: 'vitest-pug-transform',
    enforce: 'pre',
    transform(code, id) {
      if (id.endsWith('.pug')) {
        // Use the puglite compiler (same path as webpack loader)
        const libPath = join(__dirname, '../lib');

        try {
          // Import puglite modules (same as the webpack loader does)
          const lex = require(`${libPath}/lexer`);
          const parse = require(`${libPath}/parser`);
          const generateCode = require(`${libPath}/code-gen`);
          const stripComments = require(`${libPath}/strip-comments`);
          const runtimeWrap = require(`${libPath}/runtime-wrap`);

          // Read the .pug file content
          const pugSource = readFileSync(id, 'utf-8');

          // Compile: lex → parse → generate → wrap → execute (same as loader)
          const tokens = lex(pugSource, { filename: id });
          const strippedTokens = stripComments(tokens, { filename: id });
          const ast = parse(strippedTokens, { filename: id, src: pugSource });
          const js = generateCode(ast, {
            compileDebug: false,
            pretty: false,
            inlineRuntimeFunctions: false,
            templateName: 'template'
          });
          const templateFn = runtimeWrap(js);
          const html = templateFn();

          // Return as an ES module that exports the HTML string
          return {
            code: `export default ${JSON.stringify(html)};`,
            map: null
          };
        } catch (error) {
          console.error(`Error compiling pug file ${id}:`, error);
          throw error;
        }
      }
    }
  };
}
