import { Injectable } from '@angular/core';
import { getApp, initializeApp, getApps } from 'firebase/app';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ZonaCobertura } from '../models/zona-cobertura.model';

const app = getApps().length === 0 ? initializeApp(environment.firebaseConfig) : getApp();
const db = getFirestore(app);

@Injectable({ providedIn: 'root' })
export class CoberturaService {
  getZonasCobertura(): Observable<ZonaCobertura[]> {
    return new Observable(observer => {
      const unsub = onSnapshot(collection(db, 'zonas_cobertura'), snapshot => {
        const zonas = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as ZonaCobertura[];

        observer.next(zonas.filter(z => z.activa !== false));
      }, error => observer.error(error));

      return () => unsub();
    });
  }

  async addZona(zona: Omit<ZonaCobertura, 'id'>) {
    return addDoc(collection(db, 'zonas_cobertura'), zona);
  }

  async updateZona(id: string, cambios: Partial<ZonaCobertura>) {
    return updateDoc(doc(db, 'zonas_cobertura', id), cambios);
  }

  async deleteZona(id: string) {
    return deleteDoc(doc(db, 'zonas_cobertura', id));
  }

  validarDireccion(direccion: string, zonas: ZonaCobertura[]): { enCobertura: boolean; zona?: string } {
    const dir = this.normalizar(direccion);

    for (const zona of zonas) {
      const candidatos = [zona.nombre, ...zona.referencias]
        .filter(texto => !!texto)
        .map(texto => this.normalizar(texto));

      const coincide = candidatos.some(c => dir.includes(c) || c.includes(dir));
      if (coincide) {
        return { enCobertura: true, zona: zona.nombre };
      }
    }

    return { enCobertura: false };
  }

  sugerirZonasCercanas(direccion: string, zonas: ZonaCobertura[], limite = 3): string[] {
    const dirTokens = this.tokenizar(this.normalizar(direccion));

    return zonas
      .map(zona => {
        const zonaTokens = this.tokenizar(this.normalizar([zona.nombre, ...zona.referencias].join(' ')));
        const comunes = zonaTokens.filter(t => dirTokens.includes(t)).length;
        const score = comunes / Math.max(1, zonaTokens.length);

        return { nombre: zona.nombre, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limite)
      .map(item => item.nombre);
  }

  private normalizar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private tokenizar(texto: string): string[] {
    if (!texto) return [];

    const stopWords = new Set(['calle', 'avenida', 'av', 'carrera', 'cra', 'cl', 'numero', 'n', 'no', 'sector', 'barrio']);
    return texto
      .split(' ')
      .filter(token => token.length > 2 && !stopWords.has(token));
  }
}
