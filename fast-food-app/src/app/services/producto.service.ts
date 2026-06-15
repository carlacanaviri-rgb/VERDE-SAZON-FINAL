import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto.model';
import { environment } from '../../environments/environment';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { getFirebaseApp } from './firebase-app';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private http = inject(HttpClient);

  getCategorias(): Observable<string[]> {
    return this.http.get<string[]>(`${API}/productos/categorias`);
  }

  getProductos(): Observable<Producto[]> {
    return new Observable((observer) => {
      const db = getFirestore(getFirebaseApp());
      const ref = collection(db, 'productos');
      const unsub = onSnapshot(
        ref,
        (snapshot) => {
          const productos = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Producto[];
          observer.next(productos);
        },
        (error) => {
          console.error('Error leyendo productos desde Firestore:', error);
          // Fallback al backend HTTP si Firestore falla
          this.http.get<Producto[]>(`${API}/productos`).subscribe({
            next: (data) => observer.next(data),
            error: (e) => observer.error(e),
          });
        },
      );
      // Devuelve función de limpieza para cuando se haga unsubscribe
      return () => unsub();
    });
  }

  addProducto(p: Producto): Promise<any> {
    const payload: any = {
      nombre: p.nombre?.trim(),
      descripcion: p.descripcion?.trim(),
      precio: Number(p.precio),
      categoria: p.categoria,
      disponible: p.disponible ?? true,
      enPromocion: p.enPromocion ?? false,
    };
    if (p.precioPromocion != null) payload['precioPromocion'] = Number(p.precioPromocion);
    if (p.imagen?.trim()) payload['imagen'] = p.imagen.trim();
    if (p.ingredientes && p.ingredientes.length > 0) payload['ingredientes'] = p.ingredientes;
    if (p.etiquetas && p.etiquetas.length > 0) payload['etiquetas'] = p.etiquetas;
    if (p.calorias != null && !isNaN(Number(p.calorias))) payload['calorias'] = Number(p.calorias);
    return this.http.post(`${API}/productos`, payload).toPromise();
  }

  updateProducto(id: string, dto: Partial<Producto>, original: Partial<Producto>) {
    return this.http.put(`${API}/productos/${id}`, { dto, original }).toPromise();
  }

  deleteProducto(id: string, producto: Producto) {
    return this.http
      .delete(`${API}/productos/${id}`, {
        body: { nombre: producto.nombre },
      })
      .toPromise();
  }
}
