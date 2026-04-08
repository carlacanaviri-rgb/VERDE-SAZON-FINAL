import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto.model';

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private http = inject(HttpClient);

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${API}/productos`);
  }

  addProducto(p: Producto) {
    return this.http.post(`${API}/productos`, p).toPromise();
  }

  updateProducto(id: string, dto: Partial<Producto>, original: Partial<Producto>) {
    return this.http.put(`${API}/productos/${id}`, { dto, original }).toPromise();
  }

  deleteProducto(id: string, producto: Producto) {
    return this.http.delete(`${API}/productos/${id}`, {
      body: { nombre: producto.nombre }
    }).toPromise();
  }
}