import { Injectable } from '@angular/core';
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
import { ZonaCobertura } from '../models/zona-cobertura.model';
import { getFirebaseApp } from './firebase-app';

const app = getFirebaseApp();
const db = getFirestore(app);

@Injectable({ providedIn: 'root' })
export class CoberturaService {
  getZonasCobertura(incluirInactivas = false): Observable<ZonaCobertura[]> {
    return new Observable(observer => {
      const unsub = onSnapshot(collection(db, 'zonas_cobertura'), snapshot => {
        const zonas = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as ZonaCobertura[];

        observer.next(incluirInactivas ? zonas : zonas.filter(z => z.activa !== false));
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

  validarDireccion(
    direccion: string,
    zonas: ZonaCobertura[],
    lat?: number,      // 👈 nuevo parámetro
    lng?: number       // 👈 nuevo parámetro
  ): { enCobertura: boolean; zona?: string } {

    // ✅ Si hay coordenadas GPS, valida por distancia (prioridad)
    if (lat !== undefined && lng !== undefined) {
      for (const zona of zonas) {
        if (zona.lat !== undefined && zona.lng !== undefined && zona.radioKm) {
          const distancia = this.calcularDistanciaKm(lat, lng, zona.lat, zona.lng);
          if (distancia <= zona.radioKm) {
            return { enCobertura: true, zona: zona.nombre };
          }
        }
      }
      // Si ninguna zona tiene coordenadas configuradas, cae al texto
      const algunaTieneCoords = zonas.some(z => z.lat && z.lng && z.radioKm);
      if (algunaTieneCoords) {
        return { enCobertura: false }; // coordenadas fuera de rango
      }
    }

    // 📝 Fallback: valida por texto (comportamiento actual)
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

  private calcularDistanciaKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
