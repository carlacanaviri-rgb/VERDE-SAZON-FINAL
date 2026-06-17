import { TipoDieta } from './perfil-nutricional.model';

export type FranjaHoraria =
  | 'Mañana (08:00–11:00)'
  | 'Mediodía (12:00–14:00)'
  | 'Tarde (15:00–18:00)'
  | 'Noche (19:00–21:00)';

export type PlanTipo = 'Básico' | 'Estándar' | 'Premium' | 'Personalizado';

export interface Suscripcion {
  uid?: string;
  activa: boolean;
  pausada: boolean;
  pausaHasta?: string; // 'YYYY-MM-DD' opcional: reanudar a partir de
  plan: PlanTipo;
  comidasPorSemana: number; // 1..14
  diasPreferidos: string[]; // ['Lunes', 'Miércoles', ...]
  horariosPreferidos: FranjaHoraria[];
  tipoDieta: TipoDieta;
  notas?: string;
  actualizadoEn: string;
}
export interface PlanPreset {
  nombre: PlanTipo;
  comidasPorSemana: number; // 0 = personalizado (el usuario elige)
  descripcion: string;
}
export const FRANJAS_HORARIAS: FranjaHoraria[] = [
  'Mañana (08:00–11:00)',
  'Mediodía (12:00–14:00)',
  'Tarde (15:00–18:00)',
  'Noche (19:00–21:00)',
];

export const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

export const TIPOS_DIETA: TipoDieta[] = [
  'Vegetariana',
  'Vegana',
  'Keto',
  'Alta en proteína',
  'Baja en azúcar',
  'Sin restricción',
];
export const PLANES: PlanPreset[] = [
  { nombre: 'Básico', comidasPorSemana: 3, descripcion: '3 comidas por semana' },
  { nombre: 'Estándar', comidasPorSemana: 5, descripcion: '5 comidas por semana' },
  { nombre: 'Premium', comidasPorSemana: 7, descripcion: '7 comidas por semana' },
  { nombre: 'Personalizado', comidasPorSemana: 0, descripcion: 'Tú eliges la cantidad' },
];
