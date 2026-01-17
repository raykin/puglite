/**
 * Puglite Angular Webpack Integration
 *
 * Works with @angular-builders/custom-webpack.
 * Export a function that merges pug loader into existing webpack config.
 */

const path = require('path');

const loaderPath = path.resolve(__dirname, 'loader.js');

const pugRule = {
  test: /\.pug$/,
  use: [{ loader: loaderPath }]
};

/**
 * Merge function for @angular-builders/custom-webpack
 * @param {object} config - Existing webpack configuration
 * @returns {object} - Modified webpack configuration
 */
module.exports = (config) => {
  config.module = config.module || {};
  config.module.rules = config.module.rules || [];
  config.module.rules.push(pugRule);
  return config;
};
