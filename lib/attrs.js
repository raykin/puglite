'use strict';

var constantinople = require('constantinople');
var runtime = require('./runtime');

var CONSTANT_ENV = {pug: runtime, pug_interp: undefined, undefined: undefined};

// Skips constantinople, which parses every value as JavaScript. Only safe
// without escapes or line breaks: then the text between the quotes is the
// string's value.
var PLAIN_STRING = /^(?:"[^"\\\n\r]*"|'[^'\\\n\r]*')$/;

function isConstant(src) {
  return PLAIN_STRING.test(src) || constantinople(src, CONSTANT_ENV);
}
function toConstant(src) {
  if (PLAIN_STRING.test(src)) return src.slice(1, -1);
  return constantinople.toConstant(src, CONSTANT_ENV);
}

function constantValue(val) {
  return val === true ? true : toConstant(val);
}

function attrsToHtml(attrs, terse) {
  var classes = [];
  var classEscaping = [];
  var html = '';
  attrs.forEach(function(attr) {
    var val = constantValue(attr.val);
    if (attr.name === 'class') {
      classes.push(val);
      classEscaping.push(attr.mustEscape);
    } else {
      if (attr.name === 'style') val = runtime.style(val);
      html += runtime.attr(attr.name, val, attr.mustEscape, terse);
    }
  });
  if (classes.length) {
    var classHtml = runtime.classes(classes, classEscaping);
    html = runtime.attr('class', classHtml, false, terse) + html;
  }
  return html;
}

module.exports = {isConstant: isConstant, attrsToHtml: attrsToHtml};
