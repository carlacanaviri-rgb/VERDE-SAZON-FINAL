import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto.model';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private http = inject(HttpClient);

  getCategorias(): Observable<string[]> {
    return this.http.get<string[]>(`${API}/productos/categorias`);
  }

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${API}/productos`);
  }

  addProducto(p: Producto): Promise<any> {
    const payload: any = {
      nombre: p.nombre?.trim(),
      descripcion: p.descripcion?.trim(),
      precio: Number(p.precio),
      categoria: p.categoria,
      disponible: p.disponible ?? true,
    };
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
