/**
 * Webpack loader for Puglite templates
 * Compiles .pug files to HTML at build time
 */

const compileHtml = require('../lib/compile-html');

module.exports = function pugliteLoader(source) {
  if (this.cacheable) this.cacheable(true);
  const filename = this.resourcePath;

  try {
    const html = compileHtml(source, { filename });

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
