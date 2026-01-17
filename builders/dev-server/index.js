console.log('[PUGLITE] builders/dev-server/index.js LOADED');

/**
 * Puglite Dev Server Builder
 *
 * Wraps Angular's dev server with pug template support.
 */

const path = require('path');
const { createRequire } = require('module');

const projectRequire = createRequire(path.join(process.cwd(), 'package.json'));

const loaderPath = path.resolve(__dirname, '../../angular-webpack/loader.js');

const pugRule = {
  test: /\.pug$/,
  use: [{ loader: loaderPath }]
};

function serveBrowser(options, context) {
  console.log('[PUGLITE] serveBrowser() CALLED');
  const { getTransforms } = projectRequire('@angular-builders/custom-webpack');
  const { executeDevServerBuilder } = projectRequire('@angular-devkit/build-angular');

  const pugWebpackTransform = (config) => {
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push(pugRule);
    return config;
  };

  const transforms = getTransforms(options, context);
  const originalWebpackTransform = transforms.webpackConfiguration;

  transforms.webpackConfiguration = async (config) => {
    let result = config;
    if (originalWebpackTransform) {
      result = await originalWebpackTransform(result);
    }
    return pugWebpackTransform(result);
  };

  return executeDevServerBuilder(options, context, transforms);
}

const { createBuilder } = projectRequire('@angular-devkit/architect');
module.exports = createBuilder(serveBrowser);
module.exports.default = module.exports;
