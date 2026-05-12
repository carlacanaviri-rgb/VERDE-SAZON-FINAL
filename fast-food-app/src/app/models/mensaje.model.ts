export interface Mensaje {
  id?: string;
  pedidoId: string;
  autorId: string;
  autorNombre?: string;
  rol: 'cocina' | 'cliente';
  contenido: string;
  timestamp: string;
  estado: 'enviado' | 'leído';
  creadoEn?: string;
}

export interface ConversacionPedido {
  pedidoId: string;
  mensajes: Mensaje[];
  ultimaMensajeTiempo?: string;
  noLeidos?: number;
}

export interface CrearMensajeRequest {
  pedidoId: string;
  autorId: string;
  autorNombre: string;
  rol: 'cocina' | 'cliente';
  contenido: string;
}

export interface CrearMensajeResponse {
  id: string;
  pedidoId: string;
  timestamp: string;
  estado: 'enviado';
}

