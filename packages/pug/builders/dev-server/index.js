/**
 * Puglite Dev Server Builder
 *
 * Wraps Angular's executeDevServerBuilder and ensures
 * puglite templates work in development mode with hot reload
 */

const { createBuilder } = require('@angular-devkit/architect');
const { executeDevServerBuilder } = require('@angular-devkit/build-angular');

/**
 * Main dev-server builder function
 */
function serveBrowser(options, context) {
  // The dev-server will automatically use the puglite:browser builder
  // since it's configured in angular.json buildTarget
  return executeDevServerBuilder(options, context);
}

// Export as Angular builder
module.exports = createBuilder(serveBrowser);
module.exports.default = module.exports;
