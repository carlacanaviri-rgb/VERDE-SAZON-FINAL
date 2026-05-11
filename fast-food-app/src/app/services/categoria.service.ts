import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { Categoria } from '../models/categoria.model';
import { getFirebaseApp } from './firebase-app';

const db = getFirestore(getFirebaseApp());

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  /** Escucha en tiempo real la colección "categorias" */
  getCategorias(soloActivas = false): Observable<Categoria[]> {
    return new Observable((observer) => {
      const ref = query(collection(db, 'categorias'), orderBy('nombre'));
      const unsub = onSnapshot(
        ref,
        (snapshot) => {
          const cats = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Categoria);
          observer.next(soloActivas ? cats.filter((c) => c.activa !== false) : cats);
        },
        (error) => observer.error(error),
      );
      return () => unsub();
    });
  }

  async addCategoria(cat: Omit<Categoria, 'id'>) {
    return addDoc(collection(db, 'categorias'), cat);
  }

  async updateCategoria(id: string, cambios: Partial<Categoria>) {
    return updateDoc(doc(db, 'categorias', id), cambios as Record<string, unknown>);
  }

  async deleteCategoria(id: string) {
    return deleteDoc(doc(db, 'categorias', id));
  }
}
