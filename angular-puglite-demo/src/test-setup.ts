import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
  ɵDEFAULT_COMPILER_OPTIONS as DEFAULT_COMPILER_OPTIONS,
} from '@angular/platform-browser-dynamic/testing';
import { ResourceLoader } from '@angular/compiler';
import { COMPILER_OPTIONS } from '@angular/core';

// Custom ResourceLoader that uses Vite's import.meta.glob for .pug files
class ViteResourceLoader extends ResourceLoader {
  override get(url: string): Promise<string> {
    if (url.endsWith('.pug')) {
      // Use dynamic import to let Vite's plugin transform the pug file
      return import(/* @vite-ignore */ url).then(m => m.default);
    }
    // For other files, use fetch (default behavior)
    return fetch(url).then(res => res.text());
  }
}

// Initialize the Angular testing environment with custom ResourceLoader
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  {
    providers: [
      {
        provide: COMPILER_OPTIONS,
        useValue: {
          providers: [
            { provide: ResourceLoader, useClass: ViteResourceLoader }
          ]
        },
        multi: true
      }
    ]
  }
);
