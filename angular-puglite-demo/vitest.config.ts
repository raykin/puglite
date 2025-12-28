import { defineConfig } from 'vitest/config';
import { join } from 'path';
import { vitestPugPlugin } from './vitest-pug-plugin';

export default defineConfig({
  plugins: [vitestPugPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test-setup.ts']
    }
  },
  resolve: {
    alias: {
      '@angular/compiler': '@angular/compiler',
    }
  },
  esbuild: {
    target: 'es2022'
  }
});
