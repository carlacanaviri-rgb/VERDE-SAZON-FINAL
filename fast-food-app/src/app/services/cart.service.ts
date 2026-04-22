import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Producto } from '../models/producto.model';
import { CarritoItem } from '../models/carrito-item.model';

const STORAGE_KEY = 'verde-sazon-carrito';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsSubject = new BehaviorSubject<CarritoItem[]>(this.readFromStorage());

  readonly items$ = this.itemsSubject.asObservable();

  get items(): CarritoItem[] {
    return this.itemsSubject.value;
  }

  get totalItems(): number {
    return this.items.reduce((acc, item) => acc + item.cantidad, 0);
  }

  get totalMonto(): number {
    return this.items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  }

  addProducto(producto: Producto): void {
    const itemId = this.buildItemId(producto);
    const existentes = [...this.items];
    const index = existentes.findIndex(item => item.id === itemId);

    if (index >= 0) {
      existentes[index] = {
        ...existentes[index],
        cantidad: existentes[index].cantidad + 1
      };
    } else {
      existentes.push({
        id: itemId,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
        categoria: producto.categoria,
        cantidad: 1
      });
    }

    this.updateState(existentes);
  }

  incrementar(itemId: string): void {
    const actualizados = this.items.map(item => item.id === itemId
      ? { ...item, cantidad: item.cantidad + 1 }
      : item);
    this.updateState(actualizados);
  }

  decrementar(itemId: string): void {
    const actualizados = this.items
      .map(item => item.id === itemId
        ? { ...item, cantidad: item.cantidad - 1 }
        : item)
      .filter(item => item.cantidad > 0);
    this.updateState(actualizados);
  }

  remove(itemId: string): void {
    this.updateState(this.items.filter(item => item.id !== itemId));
  }

  clear(): void {
    this.updateState([]);
  }

  private updateState(items: CarritoItem[]): void {
    this.itemsSubject.next(items);
    this.writeToStorage(items);
  }

  private buildItemId(producto: Producto): string {
    if (producto.id && producto.id.trim()) {
      return producto.id;
    }
    return `${producto.nombre}-${producto.categoria}`.toLowerCase().replace(/\s+/g, '-');
  }

  private readFromStorage(): CarritoItem[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeToStorage(items: CarritoItem[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
}

