const fs = require('fs');
const { threadId } = require('worker_threads');
const pug = require('pug');

function trace(api, path) {
  const stack = new Error().stack.split('\n').slice(2, 6).join(' | ');
  console.log(`[preload t${threadId}] ${api}: ${path}\n    ${stack}`);
}

function compileIfPug(path, content, api) {
  if (typeof path === 'string' && path.endsWith('.pug')) {
    trace(api, path);
    if (typeof content === 'string') {
      return pug.render(content, { filename: path });
    }
    if (Buffer.isBuffer(content)) {
      return Buffer.from(pug.render(content.toString('utf8'), { filename: path }));
    }
  }
  return content;
}

const origSync = fs.readFileSync;
fs.readFileSync = function (path, options) {
  return compileIfPug(path, origSync.call(this, path, options), 'readFileSync');
};

const origPromise = fs.promises.readFile;
fs.promises.readFile = async function (path, options) {
  return compileIfPug(path, await origPromise.call(this, path, options), 'promises.readFile');
};

console.log(`[preload t${threadId}] fs patched in pid ${process.pid}`);
