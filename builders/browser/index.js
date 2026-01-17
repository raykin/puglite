console.log('[PUGLITE] builders/browser/index.js LOADED');

/**
 * Puglite Browser Builder
 *
 * Wraps @angular-builders/custom-webpack browser builder and auto-injects
 * the puglite webpack configuration for .pug template support.
 */

const path = require('path');
const { createRequire } = require('module');

const projectRequire = createRequire(path.join(process.cwd(), 'package.json'));

const loaderPath = path.resolve(__dirname, '../../angular-webpack/loader.js');

const pugRule = {
  test: /\.pug$/,
  use: [{ loader: loaderPath }]
};

function buildBrowser(options, context) {
  console.log('[PUGLITE] buildBrowser() CALLED');
  const { getTransforms } = projectRequire('@angular-builders/custom-webpack');
  const { executeBrowserBuilder } = projectRequire('@angular-devkit/build-angular');

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

  return executeBrowserBuilder(options, context, transforms);
}

const { createBuilder } = projectRequire('@angular-devkit/architect');
module.exports = createBuilder(buildBrowser);
module.exports.default = module.exports;
