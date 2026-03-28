import { Injectable } from '@angular/core';
import { getApp, initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto.model';
import { environment } from '../../environments/environment';

const app = getApps().length === 0 ? initializeApp(environment.firebaseConfig) : getApp();
const db = getFirestore(app);

@Injectable({ providedIn: 'root' })
export class ProductoService {

  private async log(accion: string, producto: Partial<Producto>, detalle: string = '') {
    try {
      await addDoc(collection(db, 'logs'), {
        accion,
        fecha: serverTimestamp(),
        detalle,
        snapshot: {
          nombre: producto.nombre ?? null,
          descripcion: producto.descripcion ?? null,
          precio: producto.precio ?? null,
          categoria: producto.categoria ?? null,
          disponible: producto.disponible ?? null,
          id: producto.id ?? null,
        }
      });
    } catch (e) {
      console.error('Error guardando log:', e);
    }
  }

  getProductos(): Observable<Producto[]> {
    return new Observable(observer => {
      const unsub = onSnapshot(collection(db, 'productos'), snapshot => {
        const productos = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as Producto[];
        observer.next(productos);
      }, error => {
        this.log('ERROR', {}, error.message);
        observer.error(error);
      });
      return () => unsub();
    });
  }

  async addProducto(p: Producto) {
    try {
      const result = await addDoc(collection(db, 'productos'), p);
      await this.log('CREAR', { ...p, id: result.id }, `Producto creado exitosamente`);
      return result;
    } catch (e: any) {
      await this.log('ERROR', p, `Error al crear: ${e.message}`);
      throw e;
    }
  }

 async updateProducto(id: string, cambios: Partial<Producto>, original: Partial<Producto>) {
  try {
    await updateDoc(doc(db, 'productos', id), cambios);
    
    // Detecta solo los campos que cambiaron
    const modificados: any = {};
    const anteriores: any = {};
    for (const key of Object.keys(cambios) as (keyof Producto)[]) {
      if (cambios[key] !== original[key]) {
        modificados[key] = cambios[key];
        anteriores[key] = original[key];
      }
    }

    await this.log('EDITAR', { id, ...cambios }, '');
    await addDoc(collection(db, 'logs'), {
      accion: 'EDITAR',
      fecha: serverTimestamp(),
      detalle: `Producto actualizado exitosamente`,
      id_producto: id,
      nombre_producto: cambios.nombre ?? null,
      cambios: modificados,
      valores_anteriores: anteriores
    });
  } catch (e: any) {
    await this.log('ERROR', { ...cambios, id }, `Error al editar: ${e.message}`);
    throw e;
  }
}

async deleteProducto(id: string, producto: Producto) {
  try {
    await deleteDoc(doc(db, 'productos', id));
    await addDoc(collection(db, 'logs'), {
      accion: 'ELIMINAR',
      fecha: serverTimestamp(),
      detalle: 'Producto eliminado exitosamente',
      producto_eliminado: {
        id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
        categoria: producto.categoria,
        disponible: producto.disponible
      }
    });
  } catch (e: any) {
    await this.log('ERROR', { ...producto, id }, `Error al eliminar: ${e.message}`);
    throw e;
  }
}
}


