export interface ZonaCobertura {
  id?: string;
  nombre: string;
  referencias: string[];
  activa: boolean;

  lat?: number;
  lng?: number;
  radioKm?: number;
}
