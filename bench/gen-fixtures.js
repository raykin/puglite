// Generates the scale-tier fixtures (deep / attrs / large) deterministically
// so the corpus is reproducible and tunable. Run: node bench/gen-fixtures.js
// small.pug and medium.pug are hand-authored realistic templates and are not
// touched here.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'fixtures');
fs.mkdirSync(dir, { recursive: true });

// deep.pug — a single deeply nested chain (stresses the parser's nesting
// stack and the code-gen indentation handling).
function genDeep(levels) {
  const lines = [];
  for (let i = 0; i < levels; i++) {
    lines.push('  '.repeat(i) + `.level-${i}`);
  }
  lines.push('  '.repeat(levels) + 'span Deepest node');
  return lines.join('\n') + '\n';
}

// attrs.pug — many elements each carrying many attributes (stresses the
// lexer's attribute parser and pug_attr code-gen).
function genAttrs(elements, attrsPer) {
  const lines = ['.attr-stress'];
  for (let e = 0; e < elements; e++) {
    const attrs = [];
    for (let a = 0; a < attrsPer; a++) {
      attrs.push(`data-attr-${a}="value-${e}-${a}"`);
    }
    lines.push(`  input(type="text" name="field-${e}" ${attrs.join(' ')})`);
  }
  return lines.join('\n') + '\n';
}

// large.pug — broad, repetitive structure approximating a big real template
// (stresses overall throughput / allocation volume in one compile).
function genLarge(blocks) {
  const lines = ['.large-page'];
  for (let b = 0; b < blocks; b++) {
    lines.push(`  section.block(data-block="${b}")`);
    lines.push(`    h2.block-title Block ${b}`);
    lines.push(`    p.block-text Some descriptive paragraph for block ${b}.`);
    lines.push('    ul.block-list');
    for (let i = 0; i < 5; i++) {
      lines.push(`      li.item(data-i="${i}") Item ${i} of block ${b}`);
    }
    lines.push('    .block-actions');
    lines.push('      button.btn(type="button") Primary');
    lines.push('      button.btn(type="button") Secondary');
  }
  return lines.join('\n') + '\n';
}

const out = {
  'deep.pug': genDeep(40),
  'attrs.pug': genAttrs(60, 12),
  'large.pug': genLarge(120),
};

for (const [name, content] of Object.entries(out)) {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content);
  console.log(`wrote ${name} (${content.length} bytes, ${content.split('\n').length} lines)`);
}
