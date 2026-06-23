import { Component } from '@angular/core';
import { GalleryH } from './generated-html/galleryh';

@Component({
  selector: 'app-root',
  imports: [GalleryH],
  template: `
    <div class="hello-container">
      <h1>Angular + stock esbuild (no pug)</h1>
      <p>This entry uses HTML templates only, built by the stock @angular/build:application builder.</p>
      <app-galleryh></app-galleryh>
    </div>
  `,
})
export class AppEsbuild {}
