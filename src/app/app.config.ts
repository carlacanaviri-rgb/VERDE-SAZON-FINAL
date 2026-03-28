import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Standard Angular 18 provider for better performance
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes)
  ]
};