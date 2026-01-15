/**
 * Puglite Angular Webpack Integration
 *
 * Usage:
 * const pugliteConfig = require('puglite/angular-webpack')();
 * module.exports = pugliteConfig;
 */

const path = require('path');

/**
 * Creates webpack configuration for puglite integration
 */
function createPugliteWebpackConfig(options = {}) {
  return {
    module: {
      rules: [
        {
          test: /\.pug$/,
          use: [
            {
              loader: path.resolve(__dirname, 'loader.js'),
              options
            }
          ]
        }
      ]
    }
  };
}

module.exports = createPugliteWebpackConfig;
module.exports.default = createPugliteWebpackConfig;
