import { provideZoneChangeDetection } from "@angular/core";
import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppEsbuild } from './app/esbuild/app-esbuild';

bootstrapApplication(AppEsbuild, {...appConfig, providers: [provideZoneChangeDetection(), ...appConfig.providers]})
  .catch((err) => console.error(err));
