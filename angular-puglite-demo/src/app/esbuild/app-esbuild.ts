import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="hello-container">
      <h1>Angular + stock esbuild (no pug)</h1>
      <p>This entry uses HTML templates only, built by the stock @angular/build:application builder.</p>
    </div>
  `,
})
export class AppEsbuild {}
