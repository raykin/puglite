const fs = require('fs');
const path = require('path');
const pug = require('pug');

const stats = { resolved: 0, loaded: 0, inlined: 0 };

function inlinePugTemplates(source, tsDir) {
  return source.replace(
    /templateUrl\s*:\s*(['"`])(.+?\.pug)\1/g,
    (_, __, pugPath) => {
      const abs = path.resolve(tsDir, pugPath);
      const html = pug.render(fs.readFileSync(abs, 'utf8'), { filename: abs });
      stats.inlined++;
      return `template: ${JSON.stringify(html)}`;
    }
  );
}

const plugin = {
  name: 'pug-ts-transform',
  setup(build) {
    build.onResolve({ filter: /showcase[\/\\]app(\.ts)?$/ }, (args) => {
      stats.resolved++;
      console.log('[pug-ts-transform] onResolve:', args.path);
      const abs = path.resolve(args.resolveDir, args.path.endsWith('.ts') ? args.path : args.path + '.ts');
      return { path: abs, namespace: 'ng-pug-component', pluginData: { resolveDir: args.resolveDir } };
    });

    build.onLoad({ filter: /.*/, namespace: 'ng-pug-component' }, (args) => {
      stats.loaded++;
      console.log('[pug-ts-transform] onLoad:', args.path);
      const source = fs.readFileSync(args.path, 'utf8');
      return {
        contents: inlinePugTemplates(source, path.dirname(args.path)),
        loader: 'ts',
        resolveDir: path.dirname(args.path),
      };
    });

    build.onEnd(() => {
      console.log('[pug-ts-transform] summary:', JSON.stringify(stats));
    });
  },
};

module.exports = [plugin];
