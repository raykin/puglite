# Puglite Features

Lightweight Pug for clean HTML generation without logic features.

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

## Not Supported

- Mixins
- Conditionals (`if`/`else`/`unless`)
- Loops (`each`/`for`/`while`)
- Case/when
- Pug interpolation (`#{}`) - use Angular `{{}}` instead
- Filters (`:markdown`)
- Includes
- Extends/blocks

## Use Cases

**Good for:** Static HTML, Angular/React/Vue templates, email templates

**Not for:** Server-side rendering with logic, templates requiring conditionals/loops
