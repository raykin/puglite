# Puglite Syntax & Examples

Lightweight Pug for clean HTML generation without logic features. The reference
below lists what Puglite supports; the worked examples that follow (drawn from
the test specs) demonstrate each feature.

## Supported

- **Elements & Nesting** - indentation-based
- **Classes** - `div.foo.bar`, `div(class="foo")`, `div(class=['a', 'b'])`, `div(class={active: true})`
- **IDs** - `div#my-id`
- **Attributes** - `input(type="text" required)`
- **Doctype** - `doctype html`
- **Comments** - `// visible`, `//- silent`
- **Text** - inline, piped (`| text`), blocks (`p.`)
- **Block expansion** - `li: a(href="/") Home`
- **Self-closing tags** - `img`, `br`, `hr`, `input`
- **Namespaces** - `foo:bar-baz`

## Use Cases

**Good for:** Static HTML, Angular/React/Vue templates, email templates

**Not for:** Server-side rendering with logic, templates requiring conditionals/loops

## Doctypes

```pug
doctype html
//- <!DOCTYPE html>

doctype xml
//- <?xml version="1.0" encoding="utf-8" ?>
```

## Tags & Nesting

```pug
p
div
img
br/

//- <p></p><div></div><img/><br/>
```

```pug
ul
  li a
  li b
  li
    ul
      li c
      li d
  li e

//- <ul><li>a</li><li>b</li><li><ul><li>c</li><li>d</li></ul></li><li>e</li></ul>
```

## Classes & IDs

```pug
div.something
.foo
div.foo.bar.baz
#something
#foo.bar
.bar#foo

//- <div class="something"></div>
//- <div class="foo"></div>
//- <div class="foo bar baz"></div>
//- <div id="something"></div>
//- <div class="bar" id="foo"></div>
//- <div class="bar" id="foo"></div>
```

Classes can also be given as an array or an object (keys with truthy values are kept):

```pug
div(class=["a", "b"])
div(class={active: true, disabled: false})

//- <div class="a b"></div>
//- <div class="active"></div>
```

## Styles

`style` accepts a string or an object:

```pug
div(style="color: red")
div(style={color: "red", "font-weight": "bold"})

//- <div style="color: red"></div>
//- <div style="color:red;font-weight:bold;"></div>
```

## Block Expansion

```pug
li: a foo
li: a bar
.foo: .bar baz

//- <li><a>foo</a></li><li><a>bar</a></li>
//- <div class="foo"><div class="bar">baz</div></div>
```

## Attributes

```pug
img(src="/foo.png" alt="just some foo")
input(type="checkbox" checked)
a(href="http://google.com" title="Some title")
body(class=["foo", "bar", "baz"])

//- <img src="/foo.png" alt="just some foo"/>
//- <input type="checkbox" checked="checked"/>
//- <a href="http://google.com" title="Some title"></a>
//- <body class="foo bar baz"></body>
```

### Multi-line Attributes

```pug
a(foo="bar"
  bar="baz"
  checked) foo

//- <a foo="bar" bar="baz" checked="checked">foo</a>
```

## Text

### Inline Text

```pug
p some random text
p (parens)

//- <p>some random text</p>
//- <p>(parens)</p>
```

### Piped Text

```pug
| foo
| bar
| baz

//- foo
//- bar
//- baz
```

```pug
p
  | foo
  | bar
  | baz

//- <p>foo \nbar \nbaz</p>
```

### Text Blocks

```pug
p.
  foo

  bar

//- <p>foo\n\nbar</p>
```

```pug
script.
  s.parentNode.insertBefore(g,s)

//- <script>s.parentNode.insertBefore(g,s)</script>
```

## Comments

```pug
//foo
p bar

//- <!--foo--><p>bar</p>
```

```pug
//- silent comment
p bar

//- <p>bar</p>
```

## Namespaces

```pug
fb:foo-bar
fb:user:role
rss(xmlns:atom="atom")

//- <fb:foo-bar></fb:foo-bar>
//- <fb:user:role></fb:user:role>
//- <rss xmlns:atom="atom"></rss>
```

## Angular Template Syntax

```pug
div(*ngIf="condition")
div(*ngIf="data$ | async as data")
button((click)="onClick()")
div([class]="myClass")
li(*ngFor="let item of items")
button(*ngIf="show" (click)="doSomething()" [disabled]="!enabled")
form(#profileForm="ngForm")
input(#searchbar type="text")
hex-map([cols]='cols' [rows]='rows')

//- <div *ngIf="condition"></div>
//- <div *ngIf="data$ | async as data"></div>
//- <button (click)="onClick()"></button>
//- <div [class]="myClass"></div>
//- <li *ngFor="let item of items"></li>
//- <button *ngIf="show" (click)="doSomething()" [disabled]="!enabled"></button>
//- <form #profileForm="ngForm"></form>
//- <input #searchbar type="text"/>
//- <hex-map [cols]="cols" [rows]="rows"></hex-map>
```

### Angular Interpolation Pass-through

```pug
span.status-value #{{state.current_turn.turn_number}}

//- <span class="status-value">#{{state.current_turn.turn_number}}</span>
```
