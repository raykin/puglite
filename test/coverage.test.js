'use strict';

var assert = require('assert');
var pug = require('../');
var rt = pug.runtime;
var stripComments = require('../lib/strip-comments');

describe('disabled features throw at compile', function() {
  var disabled = {
    'case statement': 'case x\n  when 1\n    p a\n  default\n    p b',
    'case with block expansion': 'case x\n  when 1: p a\n  when 2: p b',
    'if/else': 'if x\n  p a\nelse\n  p b',
    'else if': 'if x\n  p a\nelse if y\n  p b\nelse\n  p c',
    'unless': 'unless x\n  p a',
    'while loop': 'while x\n  p a',
    'each loop': 'each v in items\n  p x',
    'each with index': 'each v, i in items\n  p x',
    'each else': 'each v in items\n  p x\nelse\n  p none',
    'each of': 'each v of items\n  p x',
    'mixin definition': 'mixin m\n  p x',
    'mixin with args': 'mixin m(a, b)\n  p x',
    'mixin with rest args': 'mixin m(...items)\n  p x',
    'mixin call': '+m()',
    'mixin call with block': '+m()\n  p child',
    'buffered code': '= foo',
    'unbuffered code': '- foo',
    'unescaped buffered code': '!= foo',
    'block code': '-\n  var a = 1\n  var b = 2',
    'tag buffered code': 'p= foo',
    'tag unescaped code': 'p!= foo',
    'filter': ':markdown\n  # hi',
    'filter with args': ':markdown(opt="val")\n  # hi',
    'extends': 'extends layout',
    'include': 'include foo.pug',
    'include with filter': 'include:markdown foo.md',
    'named block': 'block content',
    'block append': 'block append content',
    'block prepend': 'block prepend content',
    'bare append': 'append content',
    'bare prepend': 'prepend content',
    'yield': 'yield',
  };

  Object.keys(disabled).forEach(function(name) {
    it('rejects ' + name, function() {
      assert.throws(function() {
        pug.compile(disabled[name]);
      });
    });
  });
});

describe('quoted attribute values', function() {
  var cases = {
    'plain strings': ['a(x="1" y=\'2\')', '<a x="1" y="2"></a>'],
    'comma separated': ['a(x="1",y="2")', '<a x="1" y="2"></a>'],
    'joined with +': ['a(x="1"+"2" y="3")', '<a x="12" y="3"></a>'],
    'joined with + and spaces': [
      'a(x="1" + "2" y="3" z="/a" + 1 w=1 - 2)',
      '<a x="12" y="3" z="/a1" w="-1"></a>',
    ],
    'escaped quote': ['a(x="1\\"2")', '<a x="1&quot;2"></a>'],
    'other quote inside': ['a(x="it\'s")', '<a x="it\'s"></a>'],
    'before an Angular binding': [
      'button(type="button" (click)="go()" [x]="y" *ngIf="z")',
      '<button type="button" (click)="go()" [x]="y" *ngIf="z"></button>',
    ],
    'across lines': ['a(\n  x="1"\n  y="2"\n)', '<a x="1" y="2"></a>'],
    'empty': ['a(x="")', '<a x=""></a>'],
  };

  Object.keys(cases).forEach(function(name) {
    it(name, function() {
      assert.equal(pug.render(cases[name][0]), cases[name][1]);
    });
  });

  it('keeps line and column of the next attribute', function() {
    try {
      pug.render('a(x="1" y=foo)', {filename: 'x.pug'});
      assert.fail('expected an error');
    } catch (err) {
      assert.equal(err.code, 'PUGLITE:NON_CONSTANT_ATTRIBUTE');
      assert.equal(err.line, 1);
      assert.equal(err.column, 9);
    }
  });
});

describe('rejected attribute syntax', function() {
  var rejected = {
    '&attributes': ['div&attributes({"a":1})', 'PUGLITE:UNSUPPORTED_SYNTAX'],
    '&attributes after attrs': [
      'div(id="x")&attributes({"a":1})',
      'PUGLITE:UNSUPPORTED_SYNTAX',
    ],
    'variable attribute': ['a(href=foo) x', 'PUGLITE:NON_CONSTANT_ATTRIBUTE'],
    'member attribute': ['a(href=foo.bar) x', 'PUGLITE:NON_CONSTANT_ATTRIBUTE'],
    'variable class': ['div(class=cls)', 'PUGLITE:NON_CONSTANT_ATTRIBUTE'],
    'variable style': ['div(style=css)', 'PUGLITE:NON_CONSTANT_ATTRIBUTE'],
    'call attribute': ['a(href=url())', 'PUGLITE:NON_CONSTANT_ATTRIBUTE'],
  };

  Object.keys(rejected).forEach(function(name) {
    it('rejects ' + name, function() {
      var c = rejected[name];
      var err;
      try {
        pug.render(c[0], {filename: 'x.pug'});
      } catch (e) {
        err = e;
      }
      assert.ok(err, 'expected a compile error');
      assert.equal(err.code, c[1]);
      assert.equal(err.line, 1);
      assert.equal(err.filename, 'x.pug');
    });
  });

  it('names the attribute and value in the message', function() {
    assert.throws(function() {
      pug.render('p\n  a(href=foo) x');
    }, /:2:[\s\S]*Attribute "href" has a non-constant value `foo`/);
  });

  it('still accepts constant expressions', function() {
    assert.equal(
      pug.render('a(href="/a"+1 class=["x", "y"] style={color: "red"} data-n=2 disabled)'),
      '<a class="x y" href="/a1" style="color:red;" data-n="2" disabled="disabled"></a>'
    );
  });
});

describe('supported feature output', function() {
  var cases = {
    'block comment without indent first line': ['//\n  a\n  b', '<!--a\nb-->'],
    'conditional comment': ['//if IE\n  p old', '<!--if IEp old-->'],
    'unbuffered comment is removed': ['//- hidden\np ok', '<p>ok</p>'],
    'buffered inline comment': ['// visible', '<!-- visible-->'],
    'hash-bracket is literal text': [
      'p #[a(href="x") link] end',
      '<p>#[a(href="x") link] end</p>',
    ],
    'custom doctype': ['doctype html PUBLIC "foo"', '<!DOCTYPE html PUBLIC "foo">'],
    'boolean attribute': ['input(checked)', '<input checked="checked"/>'],
    'boolean false attribute html': [
      'input(checked=false)',
      '<input>',
      {doctype: 'html'},
    ],
    'multiple boolean attributes': [
      'input(type="text" disabled)',
      '<input type="text" disabled="disabled"/>',
    ],
    'class array attribute': ['a(class=["x","y"]) hi', '<a class="x y">hi</a>'],
    'style object attribute': [
      'a(style={color:"red"}) hi',
      '<a style="color:red;">hi</a>',
    ],
    'multi-prop style object attribute': [
      'div(style={color: "red", "font-weight": "bold"})',
      '<div style="color:red;font-weight:bold;"></div>',
    ],
    'id and class shorthand': [
      '#main.box content',
      '<div class="box" id="main">content</div>',
    ],
    'explicit self closing': ['img/', '<img/>'],
    'dot text-only tag': ['script.\n  var a = 1', '<script>var a = 1</script>'],
    'piped text lines': ['p\n  | line1\n  | line2', '<p>line1\nline2</p>'],
    'dot block keeps hash-bracket literal': [
      'p.\n  raw text #[b bold]',
      '<p>raw text #[b bold]</p>',
    ],
    'empty attribute parens': ['div()', '<div></div>'],
    'plain leading text': ['| just text', 'just text'],
  };

  Object.keys(cases).forEach(function(name) {
    it('renders ' + name, function() {
      var c = cases[name];
      assert.equal(pug.render(c[0], c[2]), c[1]);
    });
  });
});

describe('runtime helpers', function() {
  it('attr uses toJSON when present', function() {
    assert.equal(rt.attr('data', {toJSON: function() { return 'x'; }}, true, false), ' data="x"');
  });
  it('attr emits single quotes for unescaped json with quotes', function() {
    assert.equal(rt.attr('data', {a: '"q"'}, false, false), ' data=\'{"a":"\\"q\\""}\'');
  });
  it('attr drops empty style', function() {
    assert.equal(rt.attr('style', '', false, false), '');
  });
  it('escape replaces all html chars', function() {
    assert.equal(rt.escape('<>&"x'), '&lt;&gt;&amp;&quot;x');
  });
  it('escape returns input untouched when nothing to escape', function() {
    assert.equal(rt.escape('plain'), 'plain');
  });
  it('classes escapes per the escaping mask', function() {
    assert.equal(rt.classes(['a', '<b>'], [false, true]), 'a &lt;b&gt;');
  });
});

describe('strip-comments', function() {
  it('strips an unbuffered block comment', function() {
    assert.equal(pug.render('//-\n  multi\n  line\np ok'), '<p>ok</p>');
  });
  it('keeps a buffered block comment', function() {
    assert.equal(pug.render('//\n  multi\n  line'), '<!--multi\nline-->');
  });
  it('throws on a nested comment token', function() {
    assert.throws(function() {
      stripComments([
        {type: 'comment', buffer: false, line: 1},
        {type: 'comment', buffer: false, line: 2},
      ]);
    }, /already in a comment/);
  });
  it('throws on doubled start-pipeless-text', function() {
    assert.throws(function() {
      stripComments([
        {type: 'comment', buffer: false, line: 1},
        {type: 'start-pipeless-text', line: 1},
        {type: 'start-pipeless-text', line: 1},
      ]);
    }, /already in pipeless text mode/);
  });
  it('throws on end-pipeless-text without start', function() {
    assert.throws(function() {
      stripComments([
        {type: 'comment', buffer: false, line: 1},
        {type: 'end-pipeless-text', line: 1},
      ]);
    }, /not in pipeless text mode/);
  });
});

describe('more supported syntax', function() {
  var cases = {
    'hash interpolation kept literal': ['p hi #{name} bye', '<p>hi #{name} bye</p>'],
    'bang interpolation kept literal': ['p hi !{name} bye', '<p>hi !{name} bye</p>'],
    'hash-bracket kept literal in text': ['p a #[em b] c', '<p>a #[em b] c</p>'],
    'multiline attributes': ['input(\n  type="text"\n)', '<input type="text"/>'],
    'chained block expansion': ['a: b: c hi', '<a><b><c>hi</c></b></a>'],
  };
  Object.keys(cases).forEach(function(name) {
    it('renders ' + name, function() {
      var c = cases[name];
      assert.equal(pug.render(c[0], c[2]), c[1]);
    });
  });
});

describe('text-html and interpolation lines', function() {
  it('renders block of literal html with nested pug', function() {
    assert.equal(
      pug.render('<div>\n  p nested\n<span>x</span>'),
      '<div><p>nested</p><span>x</span>'
    );
  });
  it('renders inline literal html', function() {
    assert.equal(pug.render('<custom>raw</custom>'), '<custom>raw</custom>');
  });
  it('parses a leading tag interpolation node', function() {
    assert.throws(function() {
      pug.compile('#[a(href="x") link]');
    });
  });
});
