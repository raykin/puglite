const fs = require('fs');
const pug = require('pug');

const stats = { sync: 0, promise: 0, callback: 0 };

function compileIfPug(path, content) {
  if (typeof path === 'string' && path.endsWith('.pug')) {
    if (typeof content === 'string') {
      return pug.render(content, { filename: path });
    }
    if (Buffer.isBuffer(content)) {
      return Buffer.from(pug.render(content.toString('utf8'), { filename: path }));
    }
  }
  return content;
}

function patchFs() {
  const origSync = fs.readFileSync;
  fs.readFileSync = function (path, options) {
    const result = origSync.call(this, path, options);
    const compiled = compileIfPug(path, result);
    if (compiled !== result) {
      stats.sync++;
      console.log('[pug-fs-intercept] readFileSync:', path);
    }
    return compiled;
  };

  const origPromise = fs.promises.readFile;
  fs.promises.readFile = async function (path, options) {
    const result = await origPromise.call(this, path, options);
    const compiled = compileIfPug(path, result);
    if (compiled !== result) {
      stats.promise++;
      console.log('[pug-fs-intercept] promises.readFile:', path);
    }
    return compiled;
  };

  const origCb = fs.readFile;
  fs.readFile = function (path, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    return origCb.call(this, path, options, (err, data) => {
      if (!err) {
        const compiled = compileIfPug(path, data);
        if (compiled !== data) {
          stats.callback++;
          console.log('[pug-fs-intercept] readFile:', path);
        }
        data = compiled;
      }
      callback(err, data);
    });
  };
}

const plugin = {
  name: 'pug-fs-intercept',
  setup(build) {
    console.log('[pug-fs-intercept] patching fs in pid', process.pid, 'thread main');
    patchFs();
    build.onEnd(() => {
      console.log('[pug-fs-intercept] summary:', JSON.stringify(stats));
    });
  },
};

module.exports = [plugin];
