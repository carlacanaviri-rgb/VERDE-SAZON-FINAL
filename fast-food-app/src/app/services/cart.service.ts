import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Producto } from '../models/producto.model';
import { CarritoItem } from '../models/carrito-item.model';

const STORAGE_KEY = 'verde-sazon-carrito';
const GUEST_OWNER = 'guest';

@Injectable({ providedIn: 'root' })
export class CartService {
  private storageOwner = GUEST_OWNER;
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

  setStorageOwner(ownerId: string | null): void {
    const nextOwner = ownerId?.trim() || GUEST_OWNER;
    if (nextOwner === this.storageOwner) {
      return;
    }

    this.storageOwner = nextOwner;
    this.itemsSubject.next(this.readFromStorage());
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
      const storageKey = this.storageKey;
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        // Backward compatibility for a pre-owner cart key.
        if (storageKey !== STORAGE_KEY) {
          const legacy = localStorage.getItem(STORAGE_KEY);
          if (legacy) {
            localStorage.setItem(storageKey, legacy);
            localStorage.removeItem(STORAGE_KEY);
            const parsedLegacy = JSON.parse(legacy);
            return Array.isArray(parsedLegacy) ? parsedLegacy : [];
          }
        }
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
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  private get storageKey(): string {
    return `${STORAGE_KEY}:${this.storageOwner}`;
  }
}

