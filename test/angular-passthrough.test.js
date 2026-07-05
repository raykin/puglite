'use strict';

var assert = require('assert');
var pug = require('../');

describe('angular syntax passes through untouched', function() {
  var cases = {
    'property binding': ['div([id]="x") a', '<div [id]="x">a</div>'],
    'attribute binding': ['img([src]="u")', '<img [src]="u"/>'],
    'event binding': ['button((click)="f()") go', '<button (click)="f()">go</button>'],
    'two-way binding': ['input([(ngModel)]="v")', '<input [(ngModel)]="v"/>'],
    'class binding': ['div([class.active]="a") x', '<div [class.active]="a">x</div>'],
    'style binding': ['div([style.color]="c") x', '<div [style.color]="c">x</div>'],
    'structural ngIf': ['div(*ngIf="c") a', '<div *ngIf="c">a</div>'],
    'structural ngFor': [
      'li(*ngFor="let x of xs") {{x}}',
      '<li *ngFor="let x of xs">{{x}}</li>',
    ],
    'template reference': ['input(#ref type="text")', '<input #ref type="text"/>'],
    'text interpolation': ['p {{ title }}', '<p>{{ title }}</p>'],
    'pipe in interpolation': ['p {{ d | date }}', '<p>{{ d | date }}</p>'],
    'ng-container': ['ng-container(*ngIf="c")', '<ng-container *ngIf="c"></ng-container>'],
    'ng-content': ['ng-content', '<ng-content></ng-content>'],
    'ng-template with ref': [
      'ng-template(#tpl)\n  p x',
      '<ng-template #tpl><p>x</p></ng-template>',
    ],
    'multiple bindings on one element': [
      'input([value]="v" (input)="on($event)" #f)',
      '<input [value]="v" (input)="on($event)" #f/>',
    ],
    'block control flow as piped text': [
      '.wrap\n  | @if (ready) {\n  p ok\n  | }',
      '<div class="wrap">@if (ready) {<p>ok</p>}</div>',
    ],
  };

  Object.keys(cases).forEach(function(name) {
    it('preserves ' + name, function() {
      var c = cases[name];
      assert.equal(pug.render(c[0]), c[1]);
    });
  });

  // Angular block control flow (@if/@for) is not valid at a line start in pug —
  // `@` is not a tag start. It must be written as piped/plain text (see case
  // above). This is inherited pug behavior, documented here so the limitation
  // is explicit rather than surprising.
  it('rejects line-start @if (must use piped text instead)', function() {
    assert.throws(function() {
      pug.compile('@if (c) {');
    });
  });
});
