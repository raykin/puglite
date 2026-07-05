import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';
import { describe, it, expect, beforeEach } from 'vitest';

describe('App Component with templateUrl (reproduce bug)', () => {
  let fixture: ComponentFixture<App>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App]
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    compiled = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should render hello-container from pug templateUrl', () => {
    const container = compiled.querySelector('.hello-container');
    expect(container).toBeTruthy();
  });
});
