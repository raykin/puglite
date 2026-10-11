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
          const compileHtml = require(`${libPath}/compile-html`);

          // Read the .pug file content
          const pugSource = readFileSync(id, 'utf-8');

          const html = compileHtml(pugSource, { filename: id });

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
