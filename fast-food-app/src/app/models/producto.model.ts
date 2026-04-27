export interface Producto {
  id?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  disponible: boolean;
  imagen?: string;
  ingredientes?: string[];
}
