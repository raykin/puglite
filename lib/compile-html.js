'use strict';

var lex = require('./lexer');
var stripComments = require('./strip-comments');
var parse = require('./parser');
var generateHtml = require('./html-gen');

module.exports = function compileHtml(source, options) {
  var filename = options && options.filename;
  var tokens = stripComments(lex(source, {filename: filename}), {
    filename: filename,
  });
  var ast = parse(tokens, {filename: filename, src: source});
  return generateHtml(ast, {
    pretty: options && options.pretty,
    doctype: options && options.doctype,
  });
};
