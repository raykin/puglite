'use strict';

var doctypes = require('doctypes');
var selfClosing = require('void-elements');
var makeError = require('./error');
var attrsToHtml = require('./attrs').attrsToHtml;

var WHITE_SPACE_SENSITIVE_TAGS = {
  pre: true,
  textarea: true,
};

module.exports = function generateHtml(ast, options) {
  options = options || {};
  var pp = options.pretty || '';
  if (pp && typeof pp !== 'string') pp = '  ';
  if (pp && !/^\s+$/.test(pp)) {
    throw new Error(
      'The pretty parameter should either be a boolean or whitespace only string'
    );
  }
  var html = '';
  var indents = 0;
  var escapePrettyMode = false;
  var doctype;
  var terse = false;
  var xml = false;
  var hasCompiledDoctype = false;
  var hasCompiledTag = false;
  if (options.doctype) setDoctype(options.doctype);

  function prettyIndent(offset, newline) {
    html += (newline ? '\n' : '') + Array(indents + offset).join(pp);
  }

  function setDoctype(name) {
    doctype = doctypes[name.toLowerCase()] || '<!DOCTYPE ' + name + '>';
    terse = doctype.toLowerCase() == '<!doctype html>';
    xml = 0 == doctype.indexOf('<?xml');
  }

  function visit(node) {
    visitors[node.type](node);
  }

  var visitors = {
    Block: function(block) {
      var nodes = block.nodes;
      if (
        pp &&
        nodes.length > 1 &&
        !escapePrettyMode &&
        nodes[0].type === 'Text' &&
        nodes[1].type === 'Text'
      ) {
        prettyIndent(1, true);
      }
      for (var i = 0; i < nodes.length; ++i) {
        if (
          pp &&
          i > 0 &&
          !escapePrettyMode &&
          nodes[i].type === 'Text' &&
          nodes[i - 1].type === 'Text' &&
          /\n$/.test(nodes[i - 1].val)
        ) {
          prettyIndent(1, false);
        }
        visit(nodes[i]);
      }
    },

    Doctype: function(node) {
      if (node.val || !doctype) setDoctype(node.val || 'html');
      html += doctype;
      hasCompiledDoctype = true;
    },

    Tag: function(tag) {
      indents++;
      var name = tag.name;
      var whitespaceSensitive = WHITE_SPACE_SENSITIVE_TAGS[name] === true;
      if (whitespaceSensitive) escapePrettyMode = true;

      if (!hasCompiledTag) {
        if (!hasCompiledDoctype && name === 'html' && doctype) html += doctype;
        hasCompiledTag = true;
      }

      if (pp && !tag.isInline) prettyIndent(0, true);
      html += '<' + name + attrsToHtml(tag.attrs, terse);
      if (tag.selfClosing || (!xml && selfClosing[name])) {
        html += terse && !tag.selfClosing ? '>' : '/>';
        if (
          tag.block.nodes.some(function(node) {
            return node.type !== 'Text' || !/^\s*$/.test(node.val);
          })
        ) {
          throw makeError(
            'SELF_CLOSING_CONTENT',
            name +
              ' is a self closing element: <' +
              name +
              '/> but contains nested content.',
            tag
          );
        }
      } else {
        html += '>';
        visit(tag.block);
        if (pp && !tag.isInline && !whitespaceSensitive && !tagCanInline(tag)) {
          prettyIndent(0, true);
        }
        html += '</' + name + '>';
      }

      if (whitespaceSensitive) escapePrettyMode = false;
      indents--;
    },

    Text: function(text) {
      html += text.val;
    },

    Comment: function(comment) {
      if (!comment.buffer) return;
      if (pp) prettyIndent(1, true);
      html += '<!--' + comment.val + '-->';
    },

    BlockComment: function(comment) {
      if (!comment.buffer) return;
      if (pp) prettyIndent(1, true);
      html += '<!--' + (comment.val || '');
      visit(comment.block);
      if (pp) prettyIndent(1, true);
      html += '-->';
    },
  };

  visit(ast);
  return html;
};

function tagCanInline(tag) {
  function isInline(node) {
    if (node.type === 'Block') return node.nodes.every(isInline);
    return (node.type === 'Text' && !/\n/.test(node.val)) || node.isInline;
  }

  return tag.block.nodes.every(isInline);
}
