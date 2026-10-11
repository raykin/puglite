'use strict';

// Locks the HTML the builders produce for every case, so refactors of
// lib/ can be checked against it. The builders compile with pretty: false;
// pretty: true is kept too because the golden .html files go through the
// public API, which will change.

var fs = require('fs');
var path = require('path');
var compileHtml = require('../lib/compile-html');
var runUtils = require('./run-utils');

var casesDir = path.join(__dirname, 'cases');

function compileLikeBuilders(source, filename, pretty) {
  return compileHtml(source, {filename: filename, pretty: pretty});
}

describe('builder pipeline output', function() {
  runUtils.findCases(casesDir).forEach(function(name) {
    var filename = path.join(casesDir, name + '.pug');
    var source = fs.readFileSync(filename, 'utf8');

    it(name, function() {
      expect(compileLikeBuilders(source, filename, false)).toMatchSnapshot(
        'pretty: false'
      );
      expect(compileLikeBuilders(source, filename, true)).toMatchSnapshot(
        'pretty: true'
      );
    });
  });

  it('rejects content inside a void element with file and line', function() {
    expect(function() {
      compileLikeBuilders('p\nimg\n  span x', 'x.pug', false);
    }).toThrow(
      expect.objectContaining({
        code: 'PUGLITE:SELF_CLOSING_CONTENT',
        line: 2,
        filename: 'x.pug',
      })
    );
  });

  it('closes void elements by doctype', function() {
    expect(
      compileLikeBuilders('doctype xml\nimg\nfoo/', 'x.pug', false)
    ).toBe('<?xml version="1.0" encoding="utf-8" ?><img></img><foo/>');
    expect(
      compileLikeBuilders('doctype html\ninput(disabled)\nfoo/', 'x.pug', false)
    ).toBe('<!DOCTYPE html><input disabled><foo/>');
  });
});
