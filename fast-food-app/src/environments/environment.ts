import { firebaseConfig } from './firebase.config';

// environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080',  // ← para desarrollo local
  apiUrl: 'http://localhost:8080',
  firebaseConfig
};
