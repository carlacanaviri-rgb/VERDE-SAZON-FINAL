/** Segmento de cliente (usado como "plan/membresía" según clasificacionCliente) */
export interface SegmentoPlan {
  nombre: string;
  cantidad: number;
}

/** Plato más solicitado (agregado del historial de pedidos) */
export interface PlatoTop {
  nombre: string;
  cantidad: number;
  ingresos: number;
}

/** Usuario recurrente */
export interface UsuarioRecurrente {
  nombre: string;
  email: string;
  clasificacion: string;
  pedidosCompletados: number;
  montoTotalCompletado: number;
}

/** Pedidos programados agrupados por día */
export interface ProgramadoDia {
  fecha: string; // 'YYYY-MM-DD'
  cantidad: number;
  total: number;
}

/** Resumen completo del dashboard administrativo */
export interface ResumenAdmin {
  totalClientes: number;
  totalPedidos: number;
  ingresosTotales: number;
  totalProgramados: number;
  suscripcionesActivas: number;
  segmentos: SegmentoPlan[];
  platosTop: PlatoTop[];
  usuariosRecurrentes: UsuarioRecurrente[];
  programadosPorDia: ProgramadoDia[];
}
