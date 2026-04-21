export interface ItemPedido {
  nombre: string;
  cantidad: number;
  nota: string;
}

export interface Pedido {
  id?: string;
  numero: string;
  estado: 'pendiente' | 'preparando' | 'listo';
  hora: string;
  tiempoEstimado?: number;
  items: ItemPedido[];
}
