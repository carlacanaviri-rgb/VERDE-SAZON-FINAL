export type TipoDieta =
  | 'Vegetariana'
  | 'Vegana'
  | 'Keto'
  | 'Alta en proteína'
  | 'Baja en azúcar'
  | 'Sin restricción';

export type ObjetivoNutricional =
  | 'Perder peso'
  | 'Mantener peso'
  | 'Ganar masa muscular'
  | 'Mejorar energía'
  | 'Alimentación saludable';

export interface PerfilNutricional {
  uid?: string;
  // Preferencias
  tipoDieta: TipoDieta;
  objetivoNutricional: ObjetivoNutricional;
  // Restricciones
  restriccionesDieteticas: string[]; // ej: ['sin gluten', 'sin lactosa']
  alergias: string[]; // ej: ['maní', 'mariscos']
  // Datos físicos opcionales (para recomendaciones)
  pesoKg?: number;
  alturasCm?: number;
  edadAnios?: number;
  // Meta
  actualizadoEn: string;
  completado: boolean;
}

export const RESTRICCIONES_OPCIONES = [
  'Sin gluten',
  'Sin lactosa',
  'Sin mariscos',
  'Sin cerdo',
  'Sin nueces',
  'Bajo en sodio',
  'Bajo en grasa',
  'Sin azúcar añadida',
];

export const ALERGIAS_OPCIONES = [
  'Maní',
  'Mariscos',
  'Huevo',
  'Leche',
  'Trigo',
  'Soja',
  'Nueces',
  'Pescado',
];
