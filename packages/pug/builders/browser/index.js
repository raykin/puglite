/**
 * Puglite Browser Builder
 *
 * Wraps Angular's executeBrowserBuilder and auto-injects
 * the puglite webpack configuration for .pug template support
 */

const { createBuilder } = require('@angular-devkit/architect');
const { executeBrowserBuilder } = require('@angular-devkit/build-angular');
const path = require('path');

/**
 * Creates the puglite webpack configuration transform
 */
function getPugliteTransforms() {
  return {
    webpackConfiguration: async (config) => {
      // Add puglite loader rule
      return {
        ...config,
        module: {
          ...config.module,
          rules: [
            ...(config.module?.rules || []),
            {
              test: /\.pug$/,
              use: [
                {
                  loader: path.resolve(__dirname, '../../angular-webpack/loader.js')
                }
              ]
            }
          ]
        }
      };
    }
  };
}

/**
 * Main builder function
 */
function buildBrowser(options, context) {
  // Call Angular's executeBrowserBuilder with puglite transforms
  return executeBrowserBuilder(options, context, getPugliteTransforms());
}

// Export as Angular builder
module.exports = createBuilder(buildBrowser);
module.exports.default = module.exports;
