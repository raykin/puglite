import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import staticTemplate from './puglite-static.pug';

// Full EXAMPLES.md coverage driven through the REAL puglite webpack loader:
// the component uses templateUrl (resolved/inlined by the loader at build
// time, exactly like a production Angular build), and compile-only output
// (comments, namespaced elements) is asserted on the loader's emitted HTML
// string, which Angular's renderer would otherwise strip or reject.

@Component({
  selector: 'app-panel',
  standalone: true,
  template: '<div class="panel"><ng-content></ng-content></div>',
})
class PanelHost {}

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, FormsModule, PanelHost],
  templateUrl: './angular-features.pug',
})
class FeaturesHost {
  title = 'Bindings';
  tooltip = 'a tooltip';
  count = 0;
  items = ['one', 'two', 'three'];
  show = true;
  name = 'ada';
  color = 'red';
  inc() {
    this.count++;
  }
}

describe('EXAMPLES.md coverage via the puglite webpack loader', () => {
  let fixture: ComponentFixture<FeaturesHost>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FeaturesHost] }).compileComponents();
    fixture = TestBed.createComponent(FeaturesHost);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders text interpolation', () => {
    expect(el.querySelector('.title')?.textContent?.trim()).toBe('Bindings');
  });

  it('applies property binding [x]', () => {
    expect(el.querySelector('.tooltip')?.getAttribute('title')).toBe('a tooltip');
  });

  it('wires event binding (x) and updates interpolation', () => {
    const btn = el.querySelector('.counter') as HTMLButtonElement;
    expect(btn.textContent).toContain('count is 0');
    btn.click();
    fixture.detectChanges();
    expect(btn.textContent).toContain('count is 1');
  });

  it('expands *ngFor to one node per item', () => {
    expect(el.querySelectorAll('.item').length).toBe(3);
    expect(el.querySelector('.item')?.textContent?.trim()).toBe('one');
  });

  it('honors *ngIf', () => {
    expect(el.querySelector('.conditional')).toBeTruthy();
    const hidden = TestBed.createComponent(FeaturesHost);
    hidden.componentInstance.show = false;
    hidden.detectChanges();
    expect(hidden.nativeElement.querySelector('.conditional')).toBeNull();
  });

  it('supports two-way binding [(ngModel)]', () => {
    expect((el.querySelector('.model') as HTMLInputElement).value).toBe('ada');
    expect(el.querySelector('.model-out')?.textContent?.trim()).toBe('ada');
  });

  it('applies a pipe', () => {
    expect(el.querySelector('.piped')?.textContent?.trim()).toBe('ADA');
  });

  it('applies class binding [class.x]', () => {
    expect(el.querySelector('.toggle')?.classList.contains('active')).toBe(true);
  });

  it('applies style binding [style.x]', () => {
    expect((el.querySelector('.styled') as HTMLElement).style.color).toBe('red');
  });

  it('exposes a template reference variable #ref', () => {
    const box = el.querySelector('.refin') as HTMLInputElement;
    box.value = 'typed';
    box.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(el.querySelector('.refout')?.textContent?.trim()).toBe('typed');
  });

  it('renders ng-container content without an extra element', () => {
    expect(el.querySelector('.in-container')).toBeTruthy();
  });

  it('renders an ng-template via ngTemplateOutlet', () => {
    expect(el.querySelector('.in-template')?.textContent?.trim()).toBe('templated');
  });

  it('projects content through ng-content', () => {
    expect(el.querySelector('app-panel .panel .projected')?.textContent?.trim()).toBe(
      'projected content',
    );
  });

  it('preserves indentation-based nesting', () => {
    expect(el.querySelectorAll('.nest > li').length).toBe(3);
    expect(el.querySelectorAll('.nest ul > li').length).toBe(2);
  });

  it('emits classes from string, array, and object forms', () => {
    expect(el.querySelector('.cls-string')?.className).toBe('cls-string foo bar');
    const arr = el.querySelector('.cls-array');
    expect(arr?.classList.contains('a')).toBe(true);
    expect(arr?.classList.contains('b')).toBe(true);
    const obj = el.querySelector('.cls-object');
    expect(obj?.classList.contains('active')).toBe(true);
    expect(obj?.classList.contains('disabled')).toBe(false);
  });

  it('emits an id', () => {
    expect(el.querySelector('#the-id')).toBeTruthy();
  });

  it('emits styles from string and object forms', () => {
    expect((el.querySelector('.sty-string') as HTMLElement).style.color).toBe('red');
    const obj = el.querySelector('.sty-object') as HTMLElement;
    expect(obj.style.color).toBe('red');
    expect(obj.style.fontWeight).toBe('bold');
  });

  it('emits attributes including boolean and multi-line', () => {
    const input = el.querySelector('.attrs') as HTMLInputElement;
    expect(input.getAttribute('type')).toBe('text');
    expect(input.getAttribute('name')).toBe('who');
    expect(input.hasAttribute('required')).toBe(true);
  });

  it('supports block expansion', () => {
    const a = el.querySelector('.expand .home') as HTMLAnchorElement;
    expect(a?.tagName).toBe('A');
    expect(a?.getAttribute('href')).toBe('/home');
    expect(a?.textContent?.trim()).toBe('Home');
  });

  it('emits self-closing tags', () => {
    expect(el.querySelector('img.img')?.getAttribute('src')).toBe('/logo.png');
    expect(el.querySelector('.static br')).toBeTruthy();
    expect(el.querySelector('.static hr')).toBeTruthy();
  });

  it('renders inline, piped, and block text', () => {
    expect(el.querySelector('.inline')?.textContent?.trim()).toBe('some random text');
    expect(el.querySelector('.piped-text')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'foo bar',
    );
    const block = el.querySelector('.block')?.textContent ?? '';
    expect(block).toContain('line one');
    expect(block).toContain('line two');
  });
});

// Comments and namespaced elements are compile-time output that Angular's
// renderer would strip or reject, so assert them on puglite's raw HTML string.
describe('Compile-only syntax (raw loader output)', () => {
  it('keeps visible comments and drops silent ones', () => {
    expect(staticTemplate).toContain('<!--visible comment-->');
    expect(staticTemplate).not.toContain('silent comment');
  });

  it('emits namespaced elements', () => {
    expect(staticTemplate).toContain('<fb:foo-bar></fb:foo-bar>');
    expect(staticTemplate).toContain('<fb:user:role></fb:user:role>');
    expect(staticTemplate).toContain('<rss xmlns:atom="atom"></rss>');
  });
});
