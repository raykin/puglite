'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var pug = require('../');

try {
  fs.mkdirSync(__dirname + '/temp');
} catch (ex) {
  if (ex.code !== 'EEXIST') {
    throw ex;
  }
}

describe('pug', function() {
  describe('unit tests with .render()', function() {
    it('should support doctypes', function() {
      assert.equal(
        '<?xml version="1.0" encoding="utf-8" ?>',
        pug.render('doctype xml')
      );
      assert.equal('<!DOCTYPE html>', pug.render('doctype html'));
      assert.equal('<!DOCTYPE foo bar baz>', pug.render('doctype foo bar baz'));
      assert.equal('<!DOCTYPE html>', pug.render('doctype html'));
      assert.equal('<!DOCTYPE html>', pug.render('doctype', {doctype: 'html'}));
      assert.equal(
        '<!DOCTYPE html>',
        pug.render('doctype html', {doctype: 'xml'})
      );
      assert.equal('<html></html>', pug.render('html'));
      assert.equal(
        '<!DOCTYPE html><html></html>',
        pug.render('html', {doctype: 'html'})
      );
      assert.equal(
        '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN>',
        pug.render('doctype html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN')
      );
    });

    it('should support Buffers', function() {
      assert.equal('<p>foo</p>', pug.render(Buffer.from('p foo')));
    });

    it('should support line endings', function() {
      var src = ['p', 'div', 'img'];

      var html = ['<p></p>', '<div></div>', '<img/>'].join('');

      assert.equal(html, pug.render(src.join('\n')));
      assert.equal(html, pug.render(src.join('\r')));
      assert.equal(html, pug.render(src.join('\r\n')));

      html = ['<p></p>', '<div></div>', '<img>'].join('');

      assert.equal(html, pug.render(src.join('\n'), {doctype: 'html'}));
      assert.equal(html, pug.render(src.join('\r'), {doctype: 'html'}));
      assert.equal(html, pug.render(src.join('\r\n'), {doctype: 'html'}));
    });

    it('should support single quotes', function() {
      assert.equal("<p>'foo'</p>", pug.render("p 'foo'"));
      assert.equal("<p>'foo'</p>", pug.render("p\n  | 'foo'"));
    });

    it('should support block-expansion', function() {
      assert.equal(
        '<li><a>foo</a></li><li><a>bar</a></li><li><a>baz</a></li>',
        pug.render('li: a foo\nli: a bar\nli: a baz')
      );
      assert.equal(
        '<li class="first"><a>foo</a></li><li><a>bar</a></li><li><a>baz</a></li>',
        pug.render('li.first: a foo\nli: a bar\nli: a baz')
      );
      assert.equal(
        '<div class="foo"><div class="bar">baz</div></div>',
        pug.render('.foo: .bar baz')
      );
    });

    it('should support tags', function() {
      var str = ['p', 'div', 'img', 'br/'].join('\n');

      var html = ['<p></p>', '<div></div>', '<img/>', '<br/>'].join('');

      assert.equal(html, pug.render(str), 'Test basic tags');
      assert.equal(
        '<fb:foo-bar></fb:foo-bar>',
        pug.render('fb:foo-bar'),
        'Test hyphens'
      );
      assert.equal(
        '<div class="something"></div>',
        pug.render('div.something'),
        'Test classes'
      );
      assert.equal(
        '<div id="something"></div>',
        pug.render('div#something'),
        'Test ids'
      );
      assert.equal(
        '<div class="something"></div>',
        pug.render('.something'),
        'Test stand-alone classes'
      );
      assert.equal(
        '<div id="something"></div>',
        pug.render('#something'),
        'Test stand-alone ids'
      );
      assert.equal('<div class="bar" id="foo"></div>', pug.render('#foo.bar'));
      assert.equal('<div class="bar" id="foo"></div>', pug.render('.bar#foo'));
      assert.equal(
        '<div class="bar" id="foo"></div>',
        pug.render('div#foo(class="bar")')
      );
      assert.equal(
        '<div class="bar" id="foo"></div>',
        pug.render('div(class="bar")#foo')
      );
      assert.equal(
        '<div class="foo" id="bar"></div>',
        pug.render('div(id="bar").foo')
      );
      assert.equal(
        '<div class="foo bar baz"></div>',
        pug.render('div.foo.bar.baz')
      );
      assert.equal(
        '<div class="foo bar baz"></div>',
        pug.render('div(class="foo").bar.baz')
      );
      assert.equal(
        '<div class="foo bar baz"></div>',
        pug.render('div.foo(class="bar").baz')
      );
      assert.equal(
        '<div class="foo bar baz"></div>',
        pug.render('div.foo.bar(class="baz")')
      );
      assert.equal('<div class="a-b2"></div>', pug.render('div.a-b2'));
      assert.equal('<div class="a_b2"></div>', pug.render('div.a_b2'));
      assert.equal('<fb:user></fb:user>', pug.render('fb:user'));
      assert.equal('<fb:user:role></fb:user:role>', pug.render('fb:user:role'));
      assert.equal(
        '<colgroup><col class="test"/></colgroup>',
        pug.render('colgroup\n  col.test')
      );
    });

    it('should support nested tags', function() {
      var str = [
        'ul',
        '  li a',
        '  li b',
        '  li',
        '    ul',
        '      li c',
        '      li d',
        '  li e',
      ].join('\n');

      var html = [
        '<ul>',
        '<li>a</li>',
        '<li>b</li>',
        '<li><ul><li>c</li><li>d</li></ul></li>',
        '<li>e</li>',
        '</ul>',
      ].join('');

      assert.equal(html, pug.render(str));

      var str = ['a(href="#")', '  | foo ', '  | bar ', '  | baz'].join('\n');

      assert.equal('<a href="#">foo \nbar \nbaz</a>', pug.render(str));

      var str = ['ul', '  li one', '  ul', '    | two', '    li three'].join(
        '\n'
      );

      var html = [
        '<ul>',
        '<li>one</li>',
        '<ul>two',
        '<li>three</li>',
        '</ul>',
        '</ul>',
      ].join('');

      assert.equal(html, pug.render(str));
    });

    it('should support variable length newlines', function() {
      var str = [
        'ul',
        '  li a',
        '  ',
        '  li b',
        ' ',
        '         ',
        '  li',
        '    ul',
        '      li c',
        '',
        '      li d',
        '  li e',
      ].join('\n');

      var html = [
        '<ul>',
        '<li>a</li>',
        '<li>b</li>',
        '<li><ul><li>c</li><li>d</li></ul></li>',
        '<li>e</li>',
        '</ul>',
      ].join('');

      assert.equal(html, pug.render(str));
    });

    it('should support tab conversion', function() {
      var str = [
        'ul',
        '\tli a',
        '\t',
        '\tli b',
        '\t\t',
        '\t\t\t\t\t\t',
        '\tli',
        '\t\tul',
        '\t\t\tli c',
        '',
        '\t\t\tli d',
        '\tli e',
      ].join('\n');

      var html = [
        '<ul>',
        '<li>a</li>',
        '<li>b</li>',
        '<li><ul><li>c</li><li>d</li></ul></li>',
        '<li>e</li>',
        '</ul>',
      ].join('');

      assert.equal(html, pug.render(str));
    });

    it('should support newlines', function() {
      var str = [
        'ul',
        '  li a',
        '  ',
        '    ',
        '',
        ' ',
        '  li b',
        '  li',
        '    ',
        '        ',
        ' ',
        '    ul',
        '      ',
        '      li c',
        '      li d',
        '  li e',
      ].join('\n');

      var html = [
        '<ul>',
        '<li>a</li>',
        '<li>b</li>',
        '<li><ul><li>c</li><li>d</li></ul></li>',
        '<li>e</li>',
        '</ul>',
      ].join('');

      assert.equal(html, pug.render(str));
    });

    it('should support text', function() {
      assert.equal('foo\nbar\nbaz', pug.render('| foo\n| bar\n| baz'));
      assert.equal('foo \nbar \nbaz', pug.render('| foo \n| bar \n| baz'));
      assert.equal('(hey)', pug.render('| (hey)'));
      assert.equal('some random text', pug.render('| some random text'));
      assert.equal('  foo', pug.render('|   foo'));
      assert.equal('  foo  ', pug.render('|   foo  '));
      assert.equal('  foo  \n bar    ', pug.render('|   foo  \n|  bar    '));
    });

    it('should support pipe-less text', function() {
      assert.equal(
        '<pre><code><foo></foo><bar></bar></code></pre>',
        pug.render('pre\n  code\n    foo\n\n    bar')
      );
      assert.equal('<p>foo\n\nbar</p>', pug.render('p.\n  foo\n\n  bar'));
      assert.equal(
        '<p>foo\n\n\n\nbar</p>',
        pug.render('p.\n  foo\n\n\n\n  bar')
      );
      assert.equal(
        '<p>foo\n  bar\nfoo</p>',
        pug.render('p.\n  foo\n    bar\n  foo')
      );
      assert.equal(
        '<script>s.parentNode.insertBefore(g,s)</script>',
        pug.render('script.\n  s.parentNode.insertBefore(g,s)\n')
      );
      assert.equal(
        '<script>s.parentNode.insertBefore(g,s)</script>',
        pug.render('script.\n  s.parentNode.insertBefore(g,s)')
      );
    });

    it('should support tag text', function() {
      assert.equal('<p>some random text</p>', pug.render('p some random text'));
      assert.equal(
        '<p>click<a>Google</a>.</p>',
        pug.render('p\n  | click\n  a Google\n  | .')
      );
      assert.equal('<p>(parens)</p>', pug.render('p (parens)'));
      assert.equal(
        '<p foo="bar">(parens)</p>',
        pug.render('p(foo="bar") (parens)')
      );
      assert.equal(
        '<option value="">-- (optional) foo --</option>',
        pug.render('option(value="") -- (optional) foo --')
      );
    });

    it('should support tag text block', function() {
      assert.equal(
        '<p>foo \nbar \nbaz</p>',
        pug.render('p\n  | foo \n  | bar \n  | baz')
      );
      assert.equal(
        '<label>Password:<input/></label>',
        pug.render('label\n  | Password:\n  input')
      );
      assert.equal(
        '<label>Password:<input/></label>',
        pug.render('label Password:\n  input')
      );
    });


    it('should support flexible indentation', function() {
      assert.equal(
        '<html><body><h1>Wahoo</h1><p>test</p></body></html>',
        pug.render('html\n  body\n   h1 Wahoo\n   p test')
      );
    });


    it('should support test html 5 mode', function() {
      assert.equal(
        '<!DOCTYPE html><input type="checkbox" checked>',
        pug.render('doctype html\ninput(type="checkbox", checked)')
      );
      assert.equal(
        '<!DOCTYPE html><input type="checkbox" checked>',
        pug.render('doctype html\ninput(type="checkbox", checked=true)')
      );
      assert.equal(
        '<!DOCTYPE html><input type="checkbox">',
        pug.render('doctype html\ninput(type="checkbox", checked= false)')
      );
    });

    it('should support multi-line attrs', function() {
      assert.equal(
        '<a foo="bar" bar="baz" checked="checked">foo</a>',
        pug.render('a(foo="bar"\n  bar="baz"\n  checked) foo')
      );
      assert.equal(
        '<a foo="bar" bar="baz" checked="checked">foo</a>',
        pug.render('a(foo="bar"\nbar="baz"\nchecked) foo')
      );
      assert.equal(
        '<a foo="bar" bar="baz" checked="checked">foo</a>',
        pug.render('a(foo="bar"\n,bar="baz"\n,checked) foo')
      );
      assert.equal(
        '<a foo="bar" bar="baz" checked="checked">foo</a>',
        pug.render('a(foo="bar",\nbar="baz",\nchecked) foo')
      );
    });

    it('should support attrs', function() {
      assert.equal(
        '<img src="&lt;script&gt;"/>',
        pug.render('img(src="<script>")'),
        'Test attr escaping'
      );

      assert.equal('<a data-attr="bar"></a>', pug.render('a(data-attr="bar")'));
      assert.equal(
        '<a data-attr="bar" data-attr-2="baz"></a>',
        pug.render('a(data-attr="bar", data-attr-2="baz")')
      );

      assert.equal(
        '<a title="foo,bar"></a>',
        pug.render('a(title= "foo,bar")')
      );
      assert.equal(
        '<a title="foo,bar" href="#"></a>',
        pug.render('a(title= "foo,bar", href="#")')
      );

      assert.equal(
        '<p class="foo"></p>',
        pug.render("p(class='foo')"),
        'Test single quoted attrs'
      );
      assert.equal(
        '<input type="checkbox" checked="checked"/>',
        pug.render('input( type="checkbox", checked )')
      );
      assert.equal(
        '<input type="checkbox" checked="checked"/>',
        pug.render('input( type="checkbox", checked = true )')
      );
      assert.equal(
        '<input type="checkbox"/>',
        pug.render('input(type="checkbox", checked= false)')
      );
      assert.equal(
        '<input type="checkbox"/>',
        pug.render('input(type="checkbox", checked= null)')
      );
      assert.equal(
        '<input type="checkbox"/>',
        pug.render('input(type="checkbox", checked= undefined)')
      );

      assert.equal(
        '<img src="/foo.png"/>',
        pug.render('img(src="/foo.png")'),
        'Test attr ='
      );
      assert.equal(
        '<img src="/foo.png"/>',
        pug.render('img(src  =  "/foo.png")'),
        'Test attr = whitespace'
      );
      assert.equal(
        '<img src="/foo.png"/>',
        pug.render('img(src="/foo.png")'),
        'Test attr :'
      );
      assert.equal(
        '<img src="/foo.png"/>',
        pug.render('img(src  =  "/foo.png")'),
        'Test attr : whitespace'
      );

      assert.equal(
        '<img src="/foo.png" alt="just some foo"/>',
        pug.render('img(src="/foo.png", alt="just some foo")')
      );
      assert.equal(
        '<img src="/foo.png" alt="just some foo"/>',
        pug.render('img(src = "/foo.png", alt = "just some foo")')
      );

      assert.equal(
        '<p class="foo,bar,baz"></p>',
        pug.render('p(class="foo,bar,baz")')
      );
      assert.equal(
        '<a href="http://google.com" title="Some : weird = title"></a>',
        pug.render(
          'a(href= "http://google.com", title= "Some : weird = title")'
        )
      );
      assert.equal(
        '<label for="name"></label>',
        pug.render('label(for="name")')
      );
      assert.equal(
        '<meta name="viewport" content="width=device-width"/>',
        pug.render("meta(name= 'viewport', content='width=device-width')"),
        'Test attrs that contain attr separators'
      );
      assert.equal(
        '<div style="color= white"></div>',
        pug.render("div(style='color= white')")
      );
      assert.equal(
        '<div style="color: white"></div>',
        pug.render("div(style='color: white')")
      );
      assert.equal(
        '<p class="foo"></p>',
        pug.render("p('class'='foo')"),
        'Test keys with single quotes'
      );
      assert.equal(
        '<p class="foo"></p>',
        pug.render('p("class"= \'foo\')'),
        'Test keys with double quotes'
      );

      assert.equal('<p data-lang="en"></p>', pug.render('p(data-lang = "en")'));
      assert.equal(
        '<p data-dynamic="true"></p>',
        pug.render('p("data-dynamic"= "true")')
      );
      assert.equal(
        '<p class="name" data-dynamic="true"></p>',
        pug.render('p("class"= "name", "data-dynamic"= "true")')
      );
      assert.equal(
        '<p data-dynamic="true"></p>',
        pug.render('p(\'data-dynamic\'= "true")')
      );
      assert.equal(
        '<p class="name" data-dynamic="true"></p>',
        pug.render('p(\'class\'= "name", \'data-dynamic\'= "true")')
      );
      assert.equal(
        '<p class="name" data-dynamic="true" yay="yay"></p>',
        pug.render('p(\'class\'= "name", \'data-dynamic\'= "true", yay)')
      );

      assert.equal(
        '<input checked="checked" type="checkbox"/>',
        pug.render('input(checked, type="checkbox")')
      );

      assert.equal(
        "<a data-foo=\"{ foo: 'bar', bar= 'baz' }\"></a>",
        pug.render("a(data-foo  = \"{ foo: 'bar', bar= 'baz' }\")")
      );

      assert.equal(
        '<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/>',
        pug.render(
          'meta(http-equiv="X-UA-Compatible", content="IE=edge,chrome=1")'
        )
      );

      assert.equal(
        '<div style="background: url(/images/test.png)">Foo</div>',
        pug.render("div(style= 'background: url(/images/test.png)') Foo")
      );
      assert.equal(
        '<div style="background = url(/images/test.png)">Foo</div>',
        pug.render("div(style= 'background = url(/images/test.png)') Foo")
      );
      assert.equal(
        '<div style="foo">Foo</div>',
        pug.render("div(style= ['foo', 'bar'][0]) Foo")
      );
      assert.equal(
        '<div style="bar">Foo</div>',
        pug.render("div(style= { foo: 'bar', baz: 'raz' }['foo']) Foo")
      );
      assert.equal(
        '<a href="def">Foo</a>',
        pug.render("a(href='abcdefg'.substr(3,3)) Foo")
      );
      assert.equal(
        '<a href="def">Foo</a>',
        pug.render("a(href={test: 'abcdefg'}.test.substr(3,3)) Foo")
      );
      assert.equal(
        '<a href="def">Foo</a>',
        pug.render("a(href={test: 'abcdefg'}.test.substr(3,[0,3][1])) Foo")
      );

      assert.equal(
        '<rss xmlns:atom="atom"></rss>',
        pug.render('rss(xmlns:atom="atom")')
      );
      assert.equal(
        '<rss xmlns:atom="atom"></rss>',
        pug.render('rss(\'xmlns:atom\'="atom")')
      );
      assert.equal(
        '<rss xmlns:atom="atom"></rss>',
        pug.render('rss("xmlns:atom"=\'atom\')')
      );
      assert.equal(
        '<rss xmlns:atom="atom" foo="bar"></rss>',
        pug.render("rss('xmlns:atom'=\"atom\", 'foo'= 'bar')")
      );
      assert.equal(
        '<a data-obj="{ foo: \'bar\' }"></a>',
        pug.render('a(data-obj= "{ foo: \'bar\' }")')
      );

      assert.equal(
        "<meta content=\"what's up? 'weee'\"/>",
        pug.render("meta(content=\"what's up? 'weee'\")")
      );
    });

    it('should support class attr array', function() {
      assert.equal(
        '<body class="foo bar baz"></body>',
        pug.render('body(class=["foo", "bar", "baz"])')
      );
    });

    // Removed: 'should support code attrs' - puglite doesn't support dynamic JS in attributes
    // Removed: 'should support code attrs class' - puglite doesn't support dynamic JS in attributes

    it('should support script text', function() {
      var str = [
        'script.',
        '  p foo',
        '',
        'script(type="text/template")',
        '  p foo',
        '',
        'script(type="text/template").',
        '  p foo',
      ].join('\n');

      var html = [
        '<script>p foo\n</script>',
        '<script type="text/template"><p>foo</p></script>',
        '<script type="text/template">p foo</script>',
      ].join('');

      assert.equal(html, pug.render(str));
    });

    it('should support comments', function() {
      // Regular
      var str = ['//foo', 'p bar'].join('\n');

      var html = ['<!--foo-->', '<p>bar</p>'].join('');

      assert.equal(html, pug.render(str));

      // Between tags

      var str = ['p foo', '// bar ', 'p baz'].join('\n');

      var html = ['<p>foo</p>', '<!-- bar -->', '<p>baz</p>'].join('');

      assert.equal(html, pug.render(str));

      // Quotes

      var str = "<!-- script(src: '/js/validate.js') -->",
        js = "// script(src: '/js/validate.js') ";
      assert.equal(str, pug.render(js));
    });

    it('should support unbuffered comments', function() {
      var str = ['//- foo', 'p bar'].join('\n');

      var html = ['<p>bar</p>'].join('');

      assert.equal(html, pug.render(str));

      var str = ['p foo', '//- bar ', 'p baz'].join('\n');

      var html = ['<p>foo</p>', '<p>baz</p>'].join('');

      assert.equal(html, pug.render(str));
    });

    it('should support literal html', function() {
      assert.equal(
        '<!--[if IE lt 9]>weeee<![endif]-->',
        pug.render('<!--[if IE lt 9]>weeee<![endif]-->')
      );
    });



    it('should support if', function() {
      assert.equal(
        '<iframe foo="bar"></iframe>',
        pug.render('iframe(foo="bar")')
      );
    });





    it('should not fail on js newlines', function() {
      assert.equal('<p>foo\u2028bar</p>', pug.render('p foo\u2028bar'));
      assert.equal('<p>foo\u2029bar</p>', pug.render('p foo\u2029bar'));
    });

    it('should display error line number correctly up to token level', function() {
      var str = [
        'p.',
        '  Lorem ipsum dolor sit amet, consectetur',
        '  adipisicing elit, sed do eiusmod tempor',
        '  incididunt ut labore et dolore magna aliqua.',
        'p.',
        '  Ut enim ad minim veniam, quis nostrud',
        '  exercitation ullamco laboris nisi ut aliquip',
        '  ex ea commodo consequat.',
        'p.',
        '  Duis aute irure dolor in reprehenderit',
        '  in voluptate velit esse cillum dolore eu',
        '  fugiat nulla pariatur.',
        'a(href="#" Next',
      ].join('\n');
      var errorLocation = function(str) {
        try {
          pug.render(str);
        } catch (err) {
          return err.message.split('\n')[0];
        }
      };
      assert.equal(errorLocation(str), 'Pug:13:16');
    });
  });

  describe('.compileFile()', function() {
    it('should support caching (pass 1)', function() {
      fs.writeFileSync(__dirname + '/temp/input-compileFile.pug', '.foo bar');
      var fn = pug.compileFile(__dirname + '/temp/input-compileFile.pug', {
        cache: true,
      });
      var expected = '<div class="foo">bar</div>';
      assert(fn() === expected);
    });
    it('should support caching (pass 2)', function() {
      // Poison the input file
      fs.writeFileSync(
        __dirname + '/temp/input-compileFile.pug',
        '.big fat hen'
      );
      var fn = pug.compileFile(__dirname + '/temp/input-compileFile.pug', {
        cache: true,
      });
      var expected = '<div class="foo">bar</div>';
      assert(fn() === expected);
    });
  });

  describe('.render()', function() {
    it('should support .pug.render(str, fn)', function() {
      pug.render('p foo bar', function(err, str) {
        assert.ok(!err);
        assert.equal('<p>foo bar</p>', str);
      });
    });


    it('should support .pug.render(str, options, fn) cache', function() {
      pug.render('p bar', {cache: true}, function(err, str) {
        assert.ok(
          /the "filename" option is required for caching/.test(err.message)
        );
      });

      pug.render('p foo bar', {cache: true, filename: 'test'}, function(
        err,
        str
      ) {
        assert.ok(!err);
        assert.equal('<p>foo bar</p>', str);
      });
    });
  });

  describe('.compile()', function() {
    it('should support .compile()', function() {
      var fn = pug.compile('p foo');
      assert.equal('<p>foo</p>', fn());
    });



    it('allows trailing space (see #1586)', function() {
      var res = pug.render('ul \n  li An Item');
      assert.equal('<ul> <li>An Item</li></ul>', res);
    });
  });

  describe('.compileClient()', function() {
    it('should support pug.compileClient(str)', function() {
      var src = fs.readFileSync(__dirname + '/cases/basic.pug');
      var expected = fs
        .readFileSync(__dirname + '/cases/basic.html', 'utf8')
        .replace(/\s/g, '');
      var fn = pug.compileClient(src);
      fn = Function('pug', fn.toString() + '\nreturn template;')(pug.runtime);
      var actual = fn({name: 'foo'}).replace(/\s/g, '');
      expect(actual).toBe(expected);
    });
  });

  describe('.renderFile()', function() {
    it('will synchronously return a string', function() {
      var expected = fs
        .readFileSync(__dirname + '/cases/basic.html', 'utf8')
        .replace(/\s/g, '');
      var actual = pug
        .renderFile(__dirname + '/cases/basic.pug', {name: 'foo'})
        .replace(/\s/g, '');
      assert(actual === expected);
    });
    it('when given a callback, it calls that rather than returning', function(done) {
      var expected = fs
        .readFileSync(__dirname + '/cases/basic.html', 'utf8')
        .replace(/\s/g, '');
      pug.renderFile(__dirname + '/cases/basic.pug', {name: 'foo'}, function(
        err,
        actual
      ) {
        if (err) return done(err);
        assert(actual.replace(/\s/g, '') === expected);
        done();
      });
    });
    it('when given a callback, it calls that rather than returning even if there are no options', function(done) {
      var expected = fs
        .readFileSync(__dirname + '/cases/basic.html', 'utf8')
        .replace(/\s/g, '');
      pug.renderFile(__dirname + '/cases/basic.pug', function(err, actual) {
        if (err) return done(err);
        assert(actual.replace(/\s/g, '') === expected);
        done();
      });
    });
    it('when given a callback, it calls that with any errors', function(done) {
      pug.renderFile(__dirname + '/fixtures/runtime.error.pug', function(
        err,
        actual
      ) {
        assert.ok(err);
        done();
      });
    });
    it('should support caching (pass 1)', function(done) {
      fs.writeFileSync(__dirname + '/temp/input-renderFile.pug', '.foo bar');
      pug.renderFile(
        __dirname + '/temp/input-renderFile.pug',
        {cache: true},
        function(err, actual) {
          if (err) return done(err);
          assert.equal('<div class="foo">bar</div>', actual);
          done();
        }
      );
    });
    it('should support caching (pass 2)', function(done) {
      // Poison the input file
      fs.writeFileSync(
        __dirname + '/temp/input-renderFile.pug',
        '.big fat hen'
      );
      pug.renderFile(
        __dirname + '/temp/input-renderFile.pug',
        {cache: true},
        function(err, actual) {
          if (err) return done(err);
          assert.equal('<div class="foo">bar</div>', actual);
          done();
        }
      );
    });
  });

  describe('.compileFileClient(path, options)', function() {
    it('returns a string form of a function called `template`', function() {
      var src = pug.compileFileClient(__dirname + '/cases/basic.pug');
      var expected = fs
        .readFileSync(__dirname + '/cases/basic.html', 'utf8')
        .replace(/\s/g, '');
      var fn = Function('pug', src + '\nreturn template;')(pug.runtime);
      var actual = fn({name: 'foo'}).replace(/\s/g, '');
      assert(actual === expected);
    });
    it('accepts the `name` option to rename the resulting function', function() {
      var src = pug.compileFileClient(__dirname + '/cases/basic.pug', {
        name: 'myTemplateName',
      });
      var expected = fs
        .readFileSync(__dirname + '/cases/basic.html', 'utf8')
        .replace(/\s/g, '');
      var fn = Function('pug', src + '\nreturn myTemplateName;')(pug.runtime);
      var actual = fn({name: 'foo'}).replace(/\s/g, '');
      assert(actual === expected);
    });
    it('should support caching (pass 1)', function() {
      fs.writeFileSync(
        __dirname + '/temp/input-compileFileClient.pug',
        '.foo bar'
      );
      var src = pug.compileFileClient(
        __dirname + '/temp/input-compileFileClient.pug',
        {name: 'myTemplateName', cache: true}
      );
      var expected = '<div class="foo">bar</div>';
      var fn = Function('pug', src + '\nreturn myTemplateName;')(pug.runtime);
      assert(fn() === expected);
    });
    it('should support caching (pass 2)', function() {
      // Poison the input file
      fs.writeFileSync(
        __dirname + '/temp/input-compileFileClient.pug',
        '.big fat hen'
      );
      var src = pug.compileFileClient(
        __dirname + '/temp/input-compileFileClient.pug',
        {name: 'myTemplateName', cache: true}
      );
      var expected = '<div class="foo">bar</div>';
      var fn = Function('pug', src + '\nreturn myTemplateName;')(pug.runtime);
      assert(fn() === expected);
    });
  });

  describe('.runtime', function() {
    describe('.merge', function() {
      it('merges two attribute objects, giving precedensce to the second object', function() {
        assert.deepEqual(
          pug.runtime.merge({}, {class: ['foo', 'bar'], foo: 'bar'}),
          {class: ['foo', 'bar'], foo: 'bar'}
        );
        assert.deepEqual(
          pug.runtime.merge(
            {class: ['foo'], foo: 'baz'},
            {class: ['bar'], foo: 'bar'}
          ),
          {class: ['foo', 'bar'], foo: 'bar'}
        );
        assert.deepEqual(
          pug.runtime.merge({class: ['foo', 'bar'], foo: 'bar'}, {}),
          {class: ['foo', 'bar'], foo: 'bar'}
        );
      });
    });
    describe('.attrs', function() {
      it('Renders the given attributes object', function() {
        assert.equal(pug.runtime.attrs({}), '');
        assert.equal(pug.runtime.attrs({class: []}), '');
        assert.equal(pug.runtime.attrs({class: ['foo']}), ' class="foo"');
        assert.equal(
          pug.runtime.attrs({class: ['foo'], id: 'bar'}),
          ' class="foo" id="bar"'
        );
      });
    });
  });


  describe('.name', function() {
    it('should have a name attribute', function() {
      assert.strictEqual(pug.name, 'Pug');
    });
  });

  describe('Angular template syntax', function() {
    it('should support *ngIf directive', function() {
      assert.equal(
        '<div *ngIf="condition"></div>',
        pug.render('div(*ngIf="condition")')
      );
    });

    it('should support *ngIf with "as" syntax', function() {
      assert.equal(
        '<div *ngIf="data$ | async as data"></div>',
        pug.render('div(*ngIf="data$ | async as data")')
      );
    });

    it('should support (click) event binding', function() {
      assert.equal(
        '<button (click)="onClick()"></button>',
        pug.render('button((click)="onClick()")')
      );
    });

    it('should support (click) after other attributes', function() {
      assert.equal(
        '<button type="button" (click)="signIn()"></button>',
        pug.render('button(type="button", (click)="signIn()")')
      );
    });

    it('should support [prop] property binding', function() {
      assert.equal(
        '<div [class]="myClass"></div>',
        pug.render('div([class]="myClass")')
      );
    });

    it('should support *ngFor directive', function() {
      assert.equal(
        '<li *ngFor="let item of items"></li>',
        pug.render('li(*ngFor="let item of items")')
      );
    });

    it('should support combined Angular attributes', function() {
      assert.equal(
        '<button *ngIf="show" (click)="doSomething()" [disabled]="!enabled"></button>',
        pug.render('button(*ngIf="show", (click)="doSomething()", [disabled]="!enabled")')
      );
    });

    it('should support #templateRef with value', function() {
      assert.equal(
        '<form #profileForm="ngForm"></form>',
        pug.render('form(#profileForm="ngForm")')
      );
    });

    it('should support #templateRef without value', function() {
      assert.equal(
        '<input #searchbar type="text"/>',
        pug.render('input(#searchbar, type="text")')
      );
    });

    it('should support custom element with property bindings', function() {
      assert.equal(
        '<hex-map [cols]="cols" [rows]="rows"></hex-map>',
        pug.render("hex-map([cols]='cols' [rows]='rows')")
      );
    });

    it('should support custom element with multiple property bindings', function() {
      assert.equal(
        '<hex-map [cols]="cols" [rows]="rows" [minHexSize]="minHexSize" [backgroundColor]="backgroundColor" tileGenerator="blank"></hex-map>',
        pug.render("hex-map([cols]='cols' [rows]='rows' [minHexSize]='minHexSize' [backgroundColor]='backgroundColor' tileGenerator='blank')")
      );
    });

    it('should support (click) with function call before other attr', function() {
      assert.equal(
        '<button (click)="doStuff()" type="button"></button>',
        pug.render('button((click)="doStuff()" type="button")')
      );
    });

    it('should support (click) with function call after other attr', function() {
      assert.equal(
        '<button type="button" (click)="doStuff()"></button>',
        pug.render('button(type="button" (click)="doStuff()")')
      );
    });

    it('should support *ngIf with function call after other attr', function() {
      assert.equal(
        '<button type="button" *ngIf="somethingIsCorrect()"></button>',
        pug.render('button(type="button" *ngIf="somethingIsCorrect()")')
      );
    });

    it('should support *ngIf with as syntax after other attr', function() {
      assert.equal(
        '<button type="button" *ngIf="somethingIsCorrect() as check"></button>',
        pug.render('button(type="button" *ngIf="somethingIsCorrect() as check")')
      );
    });

    it('should support # as literal text before interpolation', function() {
      assert.equal(
        '<span class="status-value">#{{state.current_turn.turn_number}}</span>',
        pug.render('span.status-value #{{state.current_turn.turn_number}}')
      );
    });
  });
});
