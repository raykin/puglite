'use strict';

// even and odd tests are arbitrarily split because jest is faster that way

const fs = require('fs');
const assert = require('assert');
const runUtils = require('./run-utils');
const pug = require('../');

var cases = runUtils.findCases(__dirname + '/cases');

fs.mkdirSync(__dirname + '/output', { recursive: true });

describe('test cases', function() {
  cases.forEach((test, i) => {
    runUtils.testSingle(it, '', test);
  });
});
