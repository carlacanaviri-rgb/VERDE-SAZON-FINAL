export interface ClientePerfil {
  clienteId: string;
  clasificacion: 'Nuevo' | 'Recurrente' | 'VIP';
  pedidosCompletados: number;
  montoTotalCompletado: number;
}

