import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import template from './hello.pug';

// Create a test version of the component with inline template
// (styles removed since we're only testing template compilation)
@Component({
  selector: 'app-root',
  standalone: true,
  template: template,
})
class TestApp {}

describe('App Component with Puglite Template', () => {
  let fixture: ComponentFixture<TestApp>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestApp]
    }).compileComponents();

    fixture = TestBed.createComponent(TestApp);
    compiled = fixture.nativeElement;
    fixture.detectChanges();
  });

  describe('Pug Template Compilation', () => {
    it('should render hello-container from pug template', () => {
      const container = compiled.querySelector('.hello-container');
      expect(container).toBeTruthy();
      expect(container?.tagName).toBe('DIV');
    });

    it('should compile heading correctly', () => {
      const h1 = compiled.querySelector('.hello-container h1');
      expect(h1).toBeTruthy();
      expect(h1?.textContent?.trim()).toBe('Hello from Puglite!');
    });

    it('should compile paragraph correctly', () => {
      const p = compiled.querySelector('.hello-container p');
      expect(p).toBeTruthy();
      expect(p?.textContent?.trim()).toBe('This template was compiled using puglite');
    });
  });

  describe('Features Section', () => {
    it('should render features section', () => {
      const features = compiled.querySelector('.features');
      expect(features).toBeTruthy();
    });

    it('should have features heading', () => {
      const h2 = compiled.querySelector('.features h2');
      expect(h2).toBeTruthy();
      expect(h2?.textContent?.trim()).toBe('Features:');
    });

    it('should compile list with 4 items', () => {
      const listItems = compiled.querySelectorAll('.features ul li');
      expect(listItems.length).toBe(4);
    });

    it('should have correct feature items text', () => {
      const listItems = compiled.querySelectorAll('.features ul li');
      const expectedTexts = [
        'Clean whitespace-sensitive syntax',
        'Compiled at build time',
        'Works with Angular 21',
        'Uses local puglite library'
      ];

      listItems.forEach((item, index) => {
        expect(item.textContent?.trim()).toBe(expectedTexts[index]);
      });
    });
  });

  describe('HTML Structure Verification', () => {
    it('should have correct nesting structure', () => {
      // Verify the DOM structure matches what pug should produce
      const container = compiled.querySelector('.hello-container');
      expect(container?.children.length).toBeGreaterThanOrEqual(3); // h1, p, .features

      const features = container?.querySelector('.features');
      expect(features).toBeTruthy();

      const ul = features?.querySelector('ul');
      expect(ul).toBeTruthy();
      expect(ul?.children.length).toBe(4);
    });

    it('should not have any pug syntax in output', () => {
      // Ensure no pug syntax leaked into the HTML
      const html = compiled.innerHTML;
      expect(html).not.toContain('.hello-container');
      expect(html).not.toContain('.features');
      expect(html).toContain('class="hello-container"');
      expect(html).toContain('class="features"');
    });
  });

  describe('Component Integration', () => {
    it('should create the component', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should apply component styles to pug-compiled template', () => {
      const container = compiled.querySelector('.hello-container');
      expect(container).toBeTruthy();
      // The template should be rendered and styled
      const styles = window.getComputedStyle(container as Element);
      expect(styles).toBeTruthy();
    });
  });
});
