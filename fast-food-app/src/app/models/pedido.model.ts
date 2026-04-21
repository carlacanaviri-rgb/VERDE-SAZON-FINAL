export interface ItemPedido {
  nombre: string;
  cantidad: number;
  nota: string;
  precio?: number;
}

export interface Pedido {
  id?: string;
  numero: string;
  estado: 'pendiente' | 'preparando' | 'listo' | 'entregado';
  hora: string;
  tiempoEstimado?: number;
  items: ItemPedido[];
}

export interface CrearPedidoRequest {
  clienteId: string;
  clienteNombre: string;
  clienteEmail: string;
  notaGeneral: string;
  total: number;
  items: ItemPedido[];
}

export interface CrearPedidoResponse {
  id: string;
  numero: string;
  estado: 'pendiente' | 'preparando' | 'listo' | 'entregado';
  hora: string;
  total: number;
}

export interface PedidoHistorialItem {
  id: string;
  numero: string;
  estado: 'pendiente' | 'preparando' | 'listo' | 'entregado';
  hora: string;
  total: number;
  creadoEn: string;
}

