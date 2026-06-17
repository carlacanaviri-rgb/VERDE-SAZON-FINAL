import { Injectable } from '@angular/core';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseApp } from './firebase-app';
import { Suscripcion } from '../models/suscripcion.model';

const db = getFirestore(getFirebaseApp());

@Injectable({ providedIn: 'root' })
export class SuscripcionService {
  /** Lee la suscripción del usuario (doc en suscripciones/{uid}). */
  async getSuscripcion(uid: string): Promise<Suscripcion | null> {
    try {
      const ref = doc(db, 'suscripciones', uid);
      const snap = await getDoc(ref);
      return snap.exists() ? (snap.data() as Suscripcion) : null;
    } catch (e) {
      console.error('[Suscripcion] error leyendo:', e);
      return null;
    }
  }

  /** Crea o actualiza la suscripción del usuario. */
  async saveSuscripcion(uid: string, sub: Suscripcion): Promise<void> {
    const ref = doc(db, 'suscripciones', uid);
    await setDoc(ref, { ...sub, uid, actualizadoEn: new Date().toISOString() }, { merge: true });
  }
}
