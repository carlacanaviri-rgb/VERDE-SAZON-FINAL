import { Injectable } from '@angular/core';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { getFirebaseApp } from './firebase-app';
import { BehaviorSubject } from 'rxjs';

export interface FavoritoItem {
  productoId: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  savedAt: string;
}

@Injectable({ providedIn: 'root' })
export class FavoritosService {
  // Set reactivo con los IDs favoritos del usuario actual
  private _favIds$ = new BehaviorSubject<Set<string>>(new Set());
  readonly favIds$ = this._favIds$.asObservable();

  private _favItems$ = new BehaviorSubject<FavoritoItem[]>([]);
  readonly favItems$ = this._favItems$.asObservable();

  private unsub: (() => void) | null = null;
  private currentUid: string | null = null;

  /** Inicia el listener en tiempo real para el usuario dado */
  iniciarListener(uid: string): void {
    if (this.currentUid === uid) return; // ya escuchando
    this.detenerListener();
    this.currentUid = uid;

    const db = getFirestore(getFirebaseApp());
    const ref = collection(db, 'favoritos');
    const q = query(ref, where('uid', '==', uid));

    this.unsub = onSnapshot(q, (snap) => {
      const ids = new Set<string>();
      const items: FavoritoItem[] = [];
      snap.forEach((d) => {
        const data = d.data() as FavoritoItem & { uid: string };
        ids.add(data.productoId);
        items.push({
          productoId: data.productoId,
          nombre: data.nombre,
          descripcion: data.descripcion,
          precio: data.precio,
          categoria: data.categoria,
          savedAt: data.savedAt,
        });
      });
      // Ordenar por fecha desc
      items.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
      this._favIds$.next(ids);
      this._favItems$.next(items);
    });
  }

  detenerListener(): void {
    this.unsub?.();
    this.unsub = null;
    this.currentUid = null;
    this._favIds$.next(new Set());
    this._favItems$.next([]);
  }

  esFavorito(productoId: string): boolean {
    return this._favIds$.value.has(productoId);
  }

  async toggleFavorito(
    uid: string,
    producto: {
      id?: string;
      nombre: string;
      descripcion: string;
      precio: number;
      categoria: string;
    },
  ): Promise<void> {
    const pid = producto.id ?? producto.nombre;
    const db = getFirestore(getFirebaseApp());
    const ref = doc(db, 'favoritos', `${uid}_${pid}`);

    if (this.esFavorito(pid)) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, {
        uid,
        productoId: pid,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
        categoria: producto.categoria,
        savedAt: new Date().toISOString(),
      });
    }
  }
}
