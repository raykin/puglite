"use strict";

/*!
 * Pug
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var fs = require("fs");
var compileHtml = require("./compile-html");
var runtime = require("./runtime");

/**
 * Name for detection
 */

exports.name = "Pug";

/**
 * Pug runtime helpers.
 */

exports.runtime = runtime;

/**
 * Template function cache.
 */

exports.cache = {};

/**
 * Get the template from a string or a file, either compiled on-the-fly or
 * read from cache (if enabled), and cache the template if needed.
 *
 * If `str` is not set, the file specified in `options.filename` will be read.
 *
 * If `options.cache` is true, this function reads the file from
 * `options.filename` so it must be set prior to calling this function.
 *
 * @param {Object} options
 * @param {String=} str
 * @return {Function}
 * @api private
 */
function handleTemplateCache(options, str) {
  var key = options.filename;
  if (options.cache && exports.cache[key]) {
    return exports.cache[key];
  } else {
    if (str === undefined) str = fs.readFileSync(options.filename, "utf8");
    var templ = exports.compile(str, options);
    if (options.cache) exports.cache[key] = templ;
    return templ;
  }
}

/**
 * Compile the given pug `str` to a function that returns its HTML.
 * Templates are static, so the function ignores its locals.
 *
 * Options:
 *
 *   - `filename` used in error messages
 *   - `pretty` indent the HTML
 *   - `doctype` the default doctype
 *
 * @param {String} str
 * @param {Options} options
 * @return {Function}
 * @api public
 */

exports.compile = function (str, options) {
  options = options || {};

  var html = compileHtml(String(str), {
    filename: options.filename,
    pretty: options.pretty,
    doctype: options.doctype,
  });

  // dependencies is always empty: include/extends were stripped from puglite;
  // the field remains for API compatibility with pug
  var template = function template() {
    return html;
  };
  template.dependencies = [];
  return template;
};

/**
 * Compile a `Function` representation of the given pug file.
 *
 * @param {String} path
 * @param {Options} options
 * @return {Function}
 * @api public
 */
exports.compileFile = function (path, options) {
  options = options || {};
  options.filename = path;
  return handleTemplateCache(options);
};

/**
 * Render the given `str` of pug.
 *
 * Options:
 *
 *   - `cache` enable template caching
 *   - `filename` filename required for caching
 *
 * @param {String} str
 * @param {Object|Function} options or fn
 * @param {Function|undefined} fn
 * @returns {String}
 * @api public
 */

exports.render = function (str, options, fn) {
  // support callback API
  if ("function" == typeof options) {
    ((fn = options), (options = undefined));
  }
  if (typeof fn === "function") {
    var res;
    try {
      res = exports.render(str, options);
    } catch (ex) {
      return fn(ex);
    }
    return fn(null, res);
  }

  options = options || {};

  // cache requires .filename
  if (options.cache && !options.filename) {
    throw new Error('the "filename" option is required for caching');
  }

  return handleTemplateCache(options, str)(options);
};

/**
 * Render a Pug file at the given `path`.
 *
 * @param {String} path
 * @param {Object|Function} options or callback
 * @param {Function|undefined} fn
 * @returns {String}
 * @api public
 */

exports.renderFile = function (path, options, fn) {
  // support callback API
  if ("function" == typeof options) {
    ((fn = options), (options = undefined));
  }
  if (typeof fn === "function") {
    var res;
    try {
      res = exports.renderFile(path, options);
    } catch (ex) {
      return fn(ex);
    }
    return fn(null, res);
  }

  options = options || {};

  options.filename = path;
  return handleTemplateCache(options)(options);
};

/**
 * Express support.
 */

exports.__express = function (path, options, fn) {
  exports.renderFile(path, options, fn);
};
