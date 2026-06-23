'use strict';

var assert = require('assert');
var loader = require('../angular-webpack/loader');

function makeContext(resourcePath) {
  return {
    resourcePath: resourcePath || 'mem.pug',
    cacheableCalls: [],
    emittedErrors: [],
    cacheable: function(flag) {
      this.cacheableCalls.push(flag);
    },
    emitError: function(err) {
      this.emittedErrors.push(err);
    },
  };
}

describe('angular-webpack loader', function() {
  it('compiles a valid template to a CommonJS module string', function() {
    var ctx = makeContext();
    var out = loader.call(ctx, 'p Hello {{ name }}');
    assert.equal(out, 'module.exports = ' + JSON.stringify('<p>Hello {{ name }}</p>') + ';');
  });

  it('marks the loader cacheable', function() {
    var ctx = makeContext();
    loader.call(ctx, 'p ok');
    assert.deepEqual(ctx.cacheableCalls, [true]);
  });

  it('throws (does not return an empty module) on a compile error', function() {
    var ctx = makeContext('broken.pug');
    // include is rejected by code-gen ("not supported in puglite")
    assert.throws(
      function() {
        loader.call(ctx, 'include ./partial.pug');
      },
      /Puglite compilation failed for broken\.pug/
    );
    // and it must NOT swallow the failure into emitError + blank output
    assert.equal(ctx.emittedErrors.length, 0);
  });
});
