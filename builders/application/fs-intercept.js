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
const nodePath = require("path");
const { Readable } = require("stream");
const compileHtml = require("../../lib/compile-html");

const stats = { compiled: 0, errors: new Map() };
const TEMPLATE_URL = /templateUrl\s*:\s*(['"`])([^'"`]+?\.pug)\1/g;
const templatesByComponent = new Map();
const templatesEverUsed = new Set();
let patched = false;

function recordTemplateUrls(path, content) {
  if (
    typeof path !== "string" ||
    !path.endsWith(".ts") ||
    path.endsWith(".d.ts") ||
    path.includes("/node_modules/")
  ) {
    return;
  }
  const source = Buffer.isBuffer(content) ? content.toString("utf8") : content;
  if (typeof source !== "string" || !source.includes(".pug")) {
    templatesByComponent.delete(path);
    return;
  }
  const templates = new Set();
  for (const match of source.matchAll(TEMPLATE_URL)) {
    const template = nodePath.resolve(nodePath.dirname(path), match[2]);
    templates.add(template);
    templatesEverUsed.add(template);
  }
  templatesByComponent.set(path, templates);
}

function isTemplateInUse(template) {
  if (!templatesEverUsed.has(template)) return true;
  for (const [component, templates] of templatesByComponent) {
    if (templates.has(template) && fs.existsSync(component)) return true;
  }
  return false;
}

function onRead(path, content) {
  recordTemplateUrls(path, content);
  return compileIfPug(path, content);
}

function compilePug(source, filename) {
  try {
    return compileHtml(source, { filename });
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
    let html;
    try {
      html = compilePug(source, path);
    } catch (error) {
      // TypeScript's sys.readFile swallows this throw and Angular renders an
      // empty template, so keep the error for the builder to report.
      stats.errors.set(path, error);
      throw error;
    }
    stats.errors.delete(path);
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
  stats.errors.clear();
  templatesByComponent.clear();
  templatesEverUsed.clear();

  origSync = fs.readFileSync;
  fs.readFileSync = function (path, options) {
    return onRead(path, origSync.call(this, path, options));
  };

  origPromise = fs.promises.readFile;
  fs.promises.readFile = async function (path, options) {
    return onRead(path, await origPromise.call(this, path, options));
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

async function* failOnPugErrors(results, logger) {
  for await (const result of results) {
    for (const path of stats.errors.keys()) {
      if (!fs.existsSync(path) || !isTemplateInUse(path)) {
        stats.errors.delete(path);
      }
    }
    if (stats.errors.size === 0) {
      yield result;
      continue;
    }
    for (const error of stats.errors.values()) logger.error(error.message);
    yield { ...result, success: false };
  }
}

module.exports = { patchFs, unpatchFs, failOnPugErrors, stats };
