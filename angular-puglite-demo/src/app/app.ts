import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './hello.pug',
  styles: [`
    .hello-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
      font-family: Arial, sans-serif;
    }

    h1 {
      color: #333;
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 0.5rem;
    }

    .features {
      margin-top: 2rem;
      padding: 1rem;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    ul {
      list-style-type: none;
      padding-left: 0;
    }

    li {
      padding: 0.5rem;
      margin: 0.5rem 0;
      background-color: white;
      border-left: 4px solid #4CAF50;
      padding-left: 1rem;
    }
  `],
})
export class App {}
