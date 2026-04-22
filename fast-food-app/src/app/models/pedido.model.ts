export interface ItemPedido {
  nombre: string;
  cantidad: number;
  nota: string;
  precio?: number;
}

export interface Pedido {
  id?: string;
  numero: string;
  estado: 'pendiente_pago' | 'pendiente' | 'preparando' | 'listo' | 'entregado';
  hora: string;
  tiempoEstimado?: number;
  items: ItemPedido[];
}

export interface CrearPedidoRequest {
  clienteId: string;
  clienteNombre: string;
  clienteEmail: string;
  direccionEntrega?: string;
  referenciaEntrega?: string;
  zonaCobertura?: string;
  latEntrega?: number;
  lngEntrega?: number;
  notaGeneral: string;
  total: number;
  items: ItemPedido[];
}

export interface CrearPedidoResponse {
  id: string;
  numero: string;
  estado: 'pendiente_pago' | 'pendiente' | 'preparando' | 'listo' | 'entregado';
  hora: string;
  total: number;
  pago?: {
    proveedor: string;
    referencia: string;
    paymentUrl: string;
    qrData: string;
  };
}

export interface PedidoHistorialItem {
  id: string;
  numero: string;
  estado: 'pendiente_pago' | 'pendiente' | 'preparando' | 'listo' | 'entregado';
  hora: string;
  total: number;
  creadoEn: string;
}

