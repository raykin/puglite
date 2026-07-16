/**
 * In-process fs intercept for the esbuild application builder.
 *
 * Angular's AOT resource loader and TypeScript read templateUrl resources
 * through fs.readFileSync / fs.promises.readFile. Patching both makes any
 * `.pug` read return compiled HTML, so `templateUrl: './x.pug'` works
 * without a bundler loader. Buffer-aware: TS reads resources without an
 * encoding and expects a Buffer back.
 */

const fs = require("fs");
const { Readable } = require("stream");
const lex = require("../../lib/lexer");
const parse = require("../../lib/parser");
const generateCode = require("../../lib/code-gen");
const stripComments = require("../../lib/strip-comments");
const runtimeWrap = require("../../lib/runtime-wrap");

const stats = { compiled: 0 };
let patched = false;

function compilePug(source, filename) {
  try {
    const tokens = lex(source, { filename });
    const strippedTokens = stripComments(tokens, { filename });
    const ast = parse(strippedTokens, { filename, src: source });
    const js = generateCode(ast, {
      compileDebug: false,
      pretty: false,
      inlineRuntimeFunctions: false,
      templateName: "template",
    });
    return runtimeWrap(js)({});
  } catch (error) {
    error.message = `Puglite compilation failed for ${filename}: ${error.message}`;
    throw error;
  }
}

function compileIfPug(path, content) {
  if (typeof path === "string" && path.endsWith(".pug")) {
    stats.compiled++;
    const source = Buffer.isBuffer(content)
      ? content.toString("utf8")
      : content;
    const html = compilePug(source, path);
    return Buffer.isBuffer(content) ? Buffer.from(html) : html;
  }
  return content;
}

let origSync;
let origPromise;
let origStream;

function patchFs() {
  if (patched) return stats;
  patched = true;

  origSync = fs.readFileSync;
  fs.readFileSync = function (path, options) {
    return compileIfPug(path, origSync.call(this, path, options));
  };

  origPromise = fs.promises.readFile;
  fs.promises.readFile = async function (path, options) {
    return compileIfPug(path, await origPromise.call(this, path, options));
  };

  origStream = fs.createReadStream;
  fs.createReadStream = function (path, options) {
    if (typeof path === "string" && path.endsWith(".pug")) {
      return Readable.from([compileIfPug(path, origSync.call(fs, path))]);
    }
    return origStream.call(this, path, options);
  };

  return stats;
}

function unpatchFs() {
  if (!patched) return;
  patched = false;
  fs.readFileSync = origSync;
  fs.promises.readFile = origPromise;
  fs.createReadStream = origStream;
}

module.exports = { patchFs, unpatchFs, stats };
