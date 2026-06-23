// Webpack config for the webdiscus build/serve targets, merged into Angular's
// webpack config by @angular-builders/custom-webpack. Registers
// @webdiscus/pug-loader so .pug templates compile to static HTML at build time
// — the webdiscus equivalent of puglite's loader, for an apples-to-apples
// memory/perf comparison on the same app.
const pugPluginNg = require('pug-plugin-ng');

module.exports = {
  module: {
    rules: [
      {
        test: /\.pug$/,
        loader: '@webdiscus/pug-loader',
        options: {
          // render -> emit static HTML string (what Angular templateUrl needs)
          mode: 'render',
          doctype: 'html',
          // allow Angular's unquoted [(banana-box)] / (event) / [prop] syntax
          plugins: [pugPluginNg],
        },
      },
    ],
  },
};
