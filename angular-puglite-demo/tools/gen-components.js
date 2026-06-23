// Generates N standalone components, each with a substantial .pug template,
// plus a Gallery component that imports and renders them all. This gives the
// build a realistic module graph (many .pug templates) so a memory comparison
// between pug loaders is meaningful — a 2-file demo shows no delta.
//
// Usage: node tools/gen-components.js [count]   (default 120)
// Wired into the app via <app-gallery> in hello.pug + Gallery in App imports.
'use strict';
const fs = require('fs');
const path = require('path');

const N = Number(process.argv[2] || 120);
const outDir = path.join(__dirname, '..', 'src', 'app', 'generated');

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// A varied, binding-safe template. Fields referenced by {{ }} are defined on
// the component (below) so Angular AOT type-checking does not fail the build.
function template(i) {
  const lines = [];
  lines.push(`section.feature(data-feature="${i}")`);
  lines.push(`  header.feature-head`);
  lines.push(`    h2.feature-title {{ title }}`);
  lines.push(`    span.badge.kind-${i % 5} {{ kind }}`);
  lines.push(`  p.feature-desc {{ description }}`);
  lines.push(`  .feature-grid`);
  for (let c = 0; c < 6; c++) {
    lines.push(`    article.card(data-card="${c}" data-feature="${i}")`);
    lines.push(`      h3.card-title Card ${c}`);
    lines.push(`      p.card-text Lorem ipsum dolor sit amet ${i}-${c}, consectetur adipiscing.`);
    lines.push(`      ul.card-list`);
    for (let li = 0; li < 4; li++) {
      lines.push(`        li.item(data-i="${li}") Item ${li}`);
    }
    lines.push(`      .card-actions`);
    lines.push(`        button.btn.primary(type="button") Open`);
    lines.push(`        button.btn.ghost(type="button") More`);
  }
  lines.push(`  footer.feature-foot`);
  lines.push(`    small Feature ${i} — {{ title }}`);
  return lines.join('\n') + '\n';
}

function component(i) {
  return (
    `import { Component } from '@angular/core';\n\n` +
    `@Component({\n` +
    `  selector: 'app-feat-${i}',\n` +
    `  imports: [],\n` +
    `  templateUrl: './feat-${i}.pug',\n` +
    `})\n` +
    `export class Feat${i} {\n` +
    `  title = 'Feature ${i}';\n` +
    `  kind = '${['core', 'beta', 'stable', 'new', 'lab'][i % 5]}';\n` +
    `  description = 'Generated feature component number ${i} for the memory benchmark.';\n` +
    `}\n`
  );
}

// HTML twin of template(i): identical structure/content, plain HTML. Used by
// the stock esbuild builder (which cannot read .pug) so we can isolate the
// webpack-vs-esbuild builder baseline from the pug loader itself.
function templateHtml(i) {
  const L = [];
  L.push(`<section class="feature" data-feature="${i}">`);
  L.push(`  <header class="feature-head">`);
  L.push(`    <h2 class="feature-title">{{ title }}</h2>`);
  L.push(`    <span class="badge kind-${i % 5}">{{ kind }}</span>`);
  L.push(`  </header>`);
  L.push(`  <p class="feature-desc">{{ description }}</p>`);
  L.push(`  <div class="feature-grid">`);
  for (let c = 0; c < 6; c++) {
    L.push(`    <article class="card" data-card="${c}" data-feature="${i}">`);
    L.push(`      <h3 class="card-title">Card ${c}</h3>`);
    L.push(`      <p class="card-text">Lorem ipsum dolor sit amet ${i}-${c}, consectetur adipiscing.</p>`);
    L.push(`      <ul class="card-list">`);
    for (let li = 0; li < 4; li++) {
      L.push(`        <li class="item" data-i="${li}">Item ${li}</li>`);
    }
    L.push(`      </ul>`);
    L.push(`      <div class="card-actions">`);
    L.push(`        <button class="btn primary" type="button">Open</button>`);
    L.push(`        <button class="btn ghost" type="button">More</button>`);
    L.push(`      </div>`);
    L.push(`    </article>`);
  }
  L.push(`  </div>`);
  L.push(`  <footer class="feature-foot">`);
  L.push(`    <small>Feature ${i} — {{ title }}</small>`);
  L.push(`  </footer>`);
  L.push(`</section>`);
  return L.join('\n') + '\n';
}

function componentHtml(i) {
  return (
    `import { Component } from '@angular/core';\n\n` +
    `@Component({\n` +
    `  selector: 'app-feath-${i}',\n` +
    `  imports: [],\n` +
    `  templateUrl: './feath-${i}.html',\n` +
    `})\n` +
    `export class FeatH${i} {\n` +
    `  title = 'Feature ${i}';\n` +
    `  kind = '${['core', 'beta', 'stable', 'new', 'lab'][i % 5]}';\n` +
    `  description = 'Generated feature component number ${i} for the memory benchmark.';\n` +
    `}\n`
  );
}

for (let i = 0; i < N; i++) {
  fs.writeFileSync(path.join(outDir, `feat-${i}.pug`), template(i));
  fs.writeFileSync(path.join(outDir, `feat-${i}.ts`), component(i));
}

// Gallery: imports every feature and renders all selectors.
const names = Array.from({ length: N }, (_, i) => `Feat${i}`);
const galleryTs =
  names.map((n, i) => `import { ${n} } from './feat-${i}';`).join('\n') +
  `\nimport { Component } from '@angular/core';\n\n` +
  `@Component({\n` +
  `  selector: 'app-gallery',\n` +
  `  imports: [\n    ${names.join(',\n    ')}\n  ],\n` +
  `  templateUrl: './gallery.pug',\n` +
  `})\n` +
  `export class Gallery {}\n`;
fs.writeFileSync(path.join(outDir, 'gallery.ts'), galleryTs);

const galleryPug =
  '.gallery\n' +
  Array.from({ length: N }, (_, i) => `  app-feat-${i}`).join('\n') +
  '\n';
fs.writeFileSync(path.join(outDir, 'gallery.pug'), galleryPug);

// --- HTML twin tree for the stock esbuild builder (no pug anywhere) ---
const outDirHtml = path.join(__dirname, '..', 'src', 'app', 'generated-html');
fs.rmSync(outDirHtml, { recursive: true, force: true });
fs.mkdirSync(outDirHtml, { recursive: true });

for (let i = 0; i < N; i++) {
  fs.writeFileSync(path.join(outDirHtml, `feath-${i}.html`), templateHtml(i));
  fs.writeFileSync(path.join(outDirHtml, `feath-${i}.ts`), componentHtml(i));
}

const namesH = Array.from({ length: N }, (_, i) => `FeatH${i}`);
const galleryHtmlTs =
  namesH.map((n, i) => `import { ${n} } from './feath-${i}';`).join('\n') +
  `\nimport { Component } from '@angular/core';\n\n` +
  `@Component({\n` +
  `  selector: 'app-galleryh',\n` +
  `  imports: [\n    ${namesH.join(',\n    ')}\n  ],\n` +
  `  templateUrl: './galleryh.html',\n` +
  `})\n` +
  `export class GalleryH {}\n`;
fs.writeFileSync(path.join(outDirHtml, 'galleryh.ts'), galleryHtmlTs);

const galleryHtml =
  '<div class="gallery">\n' +
  Array.from({ length: N }, (_, i) => `  <app-feath-${i}></app-feath-${i}>`).join('\n') +
  '\n</div>\n';
fs.writeFileSync(path.join(outDirHtml, 'galleryh.html'), galleryHtml);

console.log(`generated ${N} components + gallery in ${path.relative(process.cwd(), outDir)}`);
console.log(`.pug files: ${N + 1}`);
console.log(`generated ${N} HTML twins + gallery in ${path.relative(process.cwd(), outDirHtml)}`);
console.log(`.html files: ${N + 1}`);
