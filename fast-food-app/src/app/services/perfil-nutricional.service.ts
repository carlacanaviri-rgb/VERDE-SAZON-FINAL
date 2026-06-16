import { Injectable } from '@angular/core';
import { getFirestore, doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { getFirebaseApp } from './firebase-app';
import { PerfilNutricional } from '../models/perfil-nutricional.model';

const db = getFirestore(getFirebaseApp());

@Injectable({ providedIn: 'root' })
export class PerfilNutricionalService {
  /** Lee el perfil nutricional del usuario desde Firestore */
  async getPerfil(uid: string): Promise<PerfilNutricional | null> {
    try {
      const ref = doc(db, 'usuarios', uid, 'perfilNutricional', 'datos');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data() as PerfilNutricional;
      }
      return null;
    } catch (e) {
      console.error('[PerfilNutricional] Error leyendo perfil:', e);
      return null;
    }
  }

  /** Guarda o actualiza el perfil nutricional del usuario */
  async savePerfil(uid: string, perfil: PerfilNutricional): Promise<void> {
    const ref = doc(db, 'usuarios', uid, 'perfilNutricional', 'datos');
    await setDoc(
      ref,
      {
        ...perfil,
        uid,
        actualizadoEn: new Date().toISOString(),
        completado: true,
      },
      { merge: true },
    );
  }

  /** Verifica si el usuario ya completó su perfil */
  async perfilCompletado(uid: string): Promise<boolean> {
    const perfil = await this.getPerfil(uid);
    return perfil?.completado === true;
  }
}
