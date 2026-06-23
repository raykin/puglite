/**
 * Puglite Karma Test Builder
 *
 * Wraps Angular's Karma test runner with pug template support.
 * Follows @angular-builders/custom-webpack karma pattern.
 */

const path = require('path');
const { createRequire } = require('module');
const debug = require('util').debuglog('puglite');

const projectRequire = createRequire(path.join(process.cwd(), 'package.json'));

const loaderPath = path.resolve(__dirname, '../../angular-webpack/loader.js');

const pugRule = {
  test: /\.pug$/,
  use: [{ loader: loaderPath }]
};

const buildKarma = (options, context) => {
  debug('buildKarma() called');
  const { executeKarmaBuilder } = projectRequire('@angular-devkit/build-angular');

  const pugWebpackTransform = (config) => {
    debug('applying pug webpack transform, rules: %d', (config.module?.rules?.length || 0));
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push(pugRule);
    return config;
  };

  return executeKarmaBuilder(options, context, {
    webpackConfiguration: pugWebpackTransform
  });
};

const { createBuilder } = projectRequire('@angular-devkit/architect');
module.exports = createBuilder(buildKarma);
module.exports.default = module.exports;
