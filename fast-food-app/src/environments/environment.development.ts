import { firebaseConfig } from './firebase.config';

export const environment = {
  production: false,
  apiBaseUrl: '/api',
  apiUrl: '/api',
  mapsApiKey: (window as any).__env?.MAPS_API_KEY ?? '',
  firebaseConfig,
};

export const environmentDevelopment = environment;
