export interface ItemPedido {
  nombre: string;
  cantidad: number;
  nota: string;
}

export interface Pedido {
  id?: string;
  numero: string;
  estado: 'pendiente' | 'preparando' | 'listo' | 'entregado';
  hora: string;
  tiempoEstimado?: number;
  items: ItemPedido[];
}
