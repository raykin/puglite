var fs = require('fs');
var assert = require('assert');
var pug = require('../');

// test cases

function writeFileSync(filename, data) {
  try {
    if (fs.readFileSync(filename, 'utf8') === data.toString('utf8')) {
      return;
    }
  } catch (ex) {
    if (ex.code !== 'ENOENT') {
      throw ex;
    }
  }
  fs.writeFileSync(filename, data);
}

function findCases(dir) {
  return fs
    .readdirSync(dir)
    .filter(function(file) {
      return ~file.indexOf('.pug');
    })
    .map(function(file) {
      return file.replace('.pug', '');
    });
}

function testSingle(it, suffix, test) {
  var name = test.replace(/[-.]/g, ' ');
  it(name, function() {
    var path = __dirname + '/cases' + suffix + '/' + test + '.pug';
    var str = fs.readFileSync(path, 'utf8');
    var fn = pug.compile(str, {
      filename: path,
      pretty: true,
      basedir: __dirname + '/cases' + suffix,
    });
    var actual = fn({title: 'Pug'});

    writeFileSync(
      __dirname + '/output' + suffix + '/' + test + '.html',
      actual
    );

    var html = fs
      .readFileSync(
        __dirname + '/cases' + suffix + '/' + test + '.html',
        'utf8'
      )
      .trim()
      .replace(/\r/g, '');
    expect(actual.trim()).toEqual(html);
  });
}

module.exports = {
  findCases,
  testSingle,
};
