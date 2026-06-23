# Puglite Supported Features

Puglite is a **lightweight, simplified version of Pug** that removes advanced features to focus on clean HTML generation. This is the definitive list of what Puglite supports and what was removed.

## ✅ Supported Features

### 1. **Basic Elements & Nesting**
```pug
html
  body
    h1 Title
    p Content
```

### 2. **Classes**
Multiple syntaxes supported:
```pug
div.class-one
div.class-one.class-two.class-three
div(class="with-parentheses")
div(class=['array', 'of', 'classes'])
div(class={active: true, disabled: false})
```

### 3. **IDs**
```pug
div#my-id
section#main-content.container
```

### 4. **Attributes**
```pug
input(type="text" name="username" placeholder="Enter name" required)
a(href="https://example.com" target="_blank" rel="noopener")
img(src="/logo.png" alt="Logo")
```

### 5. **Doctype**
```pug
doctype
doctype html
doctype xml
```

### 6. **Comments**
Single-line:
```pug
// This is a comment
//- This is a silent comment (not in output)
```

Block comments:
```pug
//
  Multi-line comment block
  Spans multiple lines
```

### 7. **Text Content**

Inline:
```pug
p This is inline text
h1 Title text
```

Piped:
```pug
p
  | Line one
  | Line two
```

Text blocks:
```pug
p.
  This is a text block
  that preserves line breaks
  and whitespace.
```

### 8. **Block Expansion**
```pug
ul
  li: a(href="/home") Home
  li: a(href="/about") About
```

### 9. **Self-Closing Tags**
```pug
img(src="/logo.png")
br
hr
input(type="text")
```

### 10. **Template Tags (Raw Content)**
```pug
script(type="text/x-template").
  <article>
    <h2>{{title}}</h2>
  </article>
```

### 11. **Namespaces (XML/SVG)**
```pug
foo:bar-baz
```

### 12. **Special Characters in Text**
```pug
p "Double quotes"
p 'Single quotes'
p Special: &lt; &gt; &amp;
```

### 13. **Empty Elements**
```pug
div
span
p
```

### 14. **Whitespace Handling**
- Indentation-based nesting
- Blank lines preserved in source
- Whitespace control in output

## ❌ Removed Features (Not Supported)

Based on recent commits, these features were **intentionally removed** from Puglite:

### 1. **Mixins**
```pug
// ❌ NOT SUPPORTED
mixin article(title)
  .article
    h2= title
```

### 2. **Logic Flow (Conditionals & Loops)**
```pug
// ❌ NOT SUPPORTED
if user
  p Hello
else
  p Guest

each item in items
  li= item

for item in items
  li= item

while n < 4
  li= n++

case value
  when 1
    p One
```

### 3. **Interpolation**
```pug
// ❌ NOT SUPPORTED
p Hello #{name}
p Welcome #{user.name}
```

### 4. **Filters**
```pug
// ❌ NOT SUPPORTED
:markdown
  # Title
  Content

:coffee
  console.log 'test'
```

### 5. **Includes**
```pug
// ❌ NOT SUPPORTED
include header.pug
include:markdown article.md
```

### 6. **Extends (Template Inheritance)**
```pug
// ❌ NOT SUPPORTED
extends layout.pug

block content
  p Content here
```

### 7. **Block Prepend/Append**
```pug
// ❌ NOT SUPPORTED
block prepend scripts
  script(src="/app.js")
```

## 📋 Feature Comparison

| Feature | Pug | Puglite |
|---------|-----|---------|
| Basic elements | ✅ | ✅ |
| Classes & IDs | ✅ | ✅ |
| Attributes | ✅ | ✅ |
| Nesting | ✅ | ✅ |
| Comments | ✅ | ✅ |
| Text content | ✅ | ✅ |
| Doctype | ✅ | ✅ |
| Block expansion | ✅ | ✅ |
| **Mixins** | ✅ | ❌ |
| **Conditionals (if/else)** | ✅ | ❌ |
| **Loops (each/for/while)** | ✅ | ❌ |
| **Interpolation** | ✅ | ❌ |
| **Filters** | ✅ | ❌ |
| **Includes** | ✅ | ❌ |
| **Extends** | ✅ | ❌ |

## 🎯 Use Cases

Puglite is perfect for:
- ✅ Static HTML generation
- ✅ Angular/React/Vue component templates (without logic)
- ✅ Email templates
- ✅ Simple markup generation
- ✅ When you want cleaner syntax without dynamic features

Puglite is **NOT** suitable for:
- ❌ Dynamic server-side rendering with logic
- ❌ Templates requiring conditionals or loops
- ❌ Complex template inheritance
- ❌ Variable interpolation

## 📝 Example: Simple vs Complex

### ✅ Good Puglite Usage (Simple Template)
```pug
doctype html
html(lang="en")
  head
    title My Page
  body
    header.header
      h1 Welcome
    main.container
      section.content
        p This is content
    footer.footer
      p Copyright 2025
```

### ❌ Bad Puglite Usage (Needs Full Pug)
```pug
// This won't work in Puglite!
if user.loggedIn
  p Welcome #{user.name}
else
  a(href="/login") Login

each item in menu
  li= item
```

## 🔍 Testing Your Templates

See `/home/raykin/studio/puglite/angular-puglite-demo/src/app/comprehensive.pug` for a complete example showcasing **all** supported Puglite features.

## Summary

**Puglite Philosophy**: Clean, whitespace-sensitive HTML generation **without** programming logic. Perfect for static templates in modern frameworks where logic belongs in JavaScript/TypeScript, not templates.
