import { firebaseConfig } from './firebase.config';

// environment.ts — desarrollo local (ng serve)
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080',
  apiUrl: 'http://localhost:8080',
  // En local __env no existe, usamos la key directamente para poder testear Maps
  mapsApiKey: (window as any).__env?.MAPS_API_KEY ?? 'AIzaSyD9If1kNOXGyhZ4jmMQ3rkhD7F3c6S_v_8',
  firebaseConfig,
};
