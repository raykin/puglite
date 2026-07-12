const fs = require('fs');
const path = require('path');
const pug = require('pug');

const seen = { resolved: [], loaded: [] };

const pugPlugin = {
  name: 'angular-pug-renderer',
  setup(build) {
    build.onResolve({ filter: /\.pug$/ }, (args) => {
      seen.resolved.push(args.path);
      console.log('[pug-plugin] onResolve:', args.path, 'importer:', args.importer);
      return {
        path: path.resolve(args.resolveDir || path.dirname(args.importer || '.'), args.path),
        namespace: 'pug-template',
      };
    });

    build.onLoad({ filter: /\.pug$/, namespace: 'pug-template' }, async (args) => {
      seen.loaded.push(args.path);
      console.log('[pug-plugin] onLoad:', args.path);
      const fileContent = await fs.promises.readFile(args.path, 'utf8');
      const compiledHtml = pug.render(fileContent, { filename: args.path });
      return { contents: compiledHtml, loader: 'text' };
    });

    build.onEnd(() => {
      console.log('[pug-plugin] summary — resolved:', seen.resolved.length, 'loaded:', seen.loaded.length);
    });
  },
};

module.exports = [pugPlugin];
