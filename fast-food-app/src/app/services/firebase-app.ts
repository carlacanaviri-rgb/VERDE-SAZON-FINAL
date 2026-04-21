import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { environment } from '../../environments/environment';

export function getFirebaseApp(): FirebaseApp {
  return getApps().length === 0
    ? initializeApp(environment.firebaseConfig)
    : getApp();
}

