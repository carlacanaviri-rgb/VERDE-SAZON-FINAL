export type TipoEvento = 'programado' | 'pendiente' | 'historial' | 'planificacion';
export type EstadoEvento = 'pendiente' | 'confirmado' | 'entregado' | 'cancelado';

export interface ItemCalendario {
  nombre: string;
  cantidad: number;
  precio: number;
}

export interface EventoCalendario {
  id?: string;
  uid: string;
  tipo: TipoEvento;
  titulo: string;
  fecha: string; // 'YYYY-MM-DD'
  hora: string; // 'HH:mm'
  items: ItemCalendario[];
  total: number;
  estado: EstadoEvento;
  nota?: string;
  direccionEntrega?: string;
  // Referencia a pedido real si viene del historial
  pedidoId?: string;
  pedidoNumero?: string;
  creadoEn: string;
  actualizadoEn: string;
}

// Para crear/editar (sin id ni uid)
export type EventoCalendarioInput = Omit<
  EventoCalendario,
  'id' | 'uid' | 'creadoEn' | 'actualizadoEn'
>;

export const TIPO_COLORES: Record<
  TipoEvento,
  { bg: string; text: string; border: string; emoji: string; label: string }
> = {
  programado: {
    bg: '#ecfdf5',
    text: '#065f46',
    border: '#6ee7b7',
    emoji: '📅',
    label: 'Programado',
  },
  pendiente: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d', emoji: '⏳', label: 'Pendiente' },
  historial: { bg: '#eff6ff', text: '#1e40af', border: '#93c5fd', emoji: '📋', label: 'Historial' },
  planificacion: {
    bg: '#f5f3ff',
    text: '#5b21b6',
    border: '#c4b5fd',
    emoji: '🗓️',
    label: 'Planificación',
  },
};

export const ESTADO_COLORES: Record<EstadoEvento, { bg: string; text: string }> = {
  pendiente: { bg: '#fef3c7', text: '#92400e' },
  confirmado: { bg: '#ecfdf5', text: '#065f46' },
  entregado: { bg: '#eff6ff', text: '#1e40af' },
  cancelado: { bg: '#fef2f2', text: '#991b1b' },
};
