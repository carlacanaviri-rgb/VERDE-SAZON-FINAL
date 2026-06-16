import { Producto } from './producto.model';

/** Un plato sugerido con su puntaje y los motivos de la recomendación */
export interface SugerenciaPlato {
  producto: Producto;
  score: number;
  razones: string[];
}

/** Plan de un día de la semana */
export interface DiaPlan {
  fecha: string; // 'YYYY-MM-DD' (local)
  nombreDia: string; // 'Lunes'
  opciones: SugerenciaPlato[]; // ranking de platos para ese día
  indice: number; // opción mostrada actualmente
  aceptado: boolean;
  programado: boolean;
}

/** Plan semanal completo */
export interface PlanSemanal {
  generadoEn: string;
  dias: DiaPlan[];
}
