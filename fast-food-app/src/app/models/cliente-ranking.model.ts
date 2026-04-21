export interface ClienteRanking {
  clienteId: string;
  nombre: string;
  email: string;
  clasificacion: 'Nuevo' | 'Recurrente' | 'VIP';
  pedidosCompletados: number;
  montoTotalCompletado: number;
}

