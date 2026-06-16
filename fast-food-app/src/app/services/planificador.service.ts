import { Injectable, inject } from '@angular/core';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseApp } from './firebase-app';
import { Producto } from '../models/producto.model';
import { PerfilNutricional } from '../models/perfil-nutricional.model';
import { PerfilNutricionalService } from './perfil-nutricional.service';
import { DiaPlan, PlanSemanal, SugerenciaPlato } from '../models/planificador.model';

const db = getFirestore(getFirebaseApp());

const DIAS_NOMBRE = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const DIETA_KEYWORDS: Record<string, string[]> = {
  vegetariana: ['vegetariano', 'vegetariana', 'ensalada', 'vegetal', 'verdura'],
  vegana: ['vegano', 'vegana', 'plant', 'ensalada', 'vegetal'],
  keto: ['keto', 'proteína', 'protein', 'bowl', 'wrap'],
  'alta en proteína': ['proteína', 'protein', 'pollo', 'bowl', 'wrap'],
  'baja en azúcar': ['sin azúcar', 'low sugar', 'ensalada', 'bowl'],
};

@Injectable({ providedIn: 'root' })
export class PlanificadorService {
  private perfilSvc = inject(PerfilNutricionalService);

  /**
   * Genera un plan semanal de alimentación combinando:
   *  - Preferencias del usuario (tipo de dieta + restricciones/alergias)
   *  - Historial de pedidos (frecuencia de platos)
   *  - Objetivos nutricionales
   *  - Favoritos
   */
  async generarPlan(uid: string, diasCount = 7): Promise<PlanSemanal> {
    console.log('[PlanificadorService] generarPlan: leyendo datos…');
    // Cada lectura es defensiva: si una falla o se cuelga, devuelve un valor por
    // defecto en vez de dejar el plan colgado indefinidamente.
    const [productos, perfil, frecuencia, favoritos] = await Promise.all([
      this.conTimeout(this.getProductosDisponibles(), 6000, [] as Producto[]),
      this.conTimeout(this.perfilSvc.getPerfil(uid), 6000, null),
      this.conTimeout(this.getFrecuenciaPedidos(uid), 6000, new Map<string, number>()),
      this.conTimeout(this.getFavoritos(uid), 6000, new Set<string>()),
    ]);
    console.log('[PlanificadorService] datos listos. productos =', productos.length);

    const ranking = productos
      .map((p) => this.puntuar(p, perfil, frecuencia, favoritos))
      .filter((s): s is SugerenciaPlato => s !== null)
      .sort((a, b) => b.score - a.score);

    const dias = this.construirDias(ranking, diasCount);
    return { generadoEn: new Date().toISOString(), dias };
  }

  /** Resuelve con `fallback` si la promesa falla o tarda más de `ms`. */
  private conTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
    return Promise.race([
      p.catch((e) => {
        console.error('[PlanificadorService] lectura falló:', e);
        return fallback;
      }),
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]);
  }

  // ── Puntuación de un plato (null = excluido por conflicto) ──────────
  private puntuar(
    p: Producto,
    perfil: PerfilNutricional | null,
    frecuencia: Map<string, number>,
    favoritos: Set<string>,
  ): SugerenciaPlato | null {
    const razones: string[] = [];
    let score = 1; // base para que todo plato tenga al menos algo de peso

    const nombreLower = p.nombre.toLowerCase();
    const tags = [
      ...(p.etiquetas ?? []).map((t) => t.toLowerCase()),
      p.categoria.toLowerCase(),
      nombreLower,
      (p.descripcion ?? '').toLowerCase(),
    ].join(' ');

    // Excluir si choca con alergias / restricciones
    if (perfil?.completado && this.tieneConflicto(p, perfil)) {
      return null;
    }

    // Preferencia de dieta
    if (perfil?.completado) {
      const dieta = (perfil.tipoDieta ?? '').toLowerCase();
      const kws = DIETA_KEYWORDS[dieta] ?? [];
      if (kws.some((k) => tags.includes(k))) {
        score += 4;
        razones.push(`Encaja con tu dieta ${perfil.tipoDieta}`);
      }
      // Objetivo nutricional
      score += this.puntuarObjetivo(p, perfil, tags, razones);
    }

    // Historial de pedidos
    const veces = frecuencia.get(nombreLower) ?? 0;
    if (veces > 0) {
      score += Math.min(veces, 5) * 1.5;
      razones.push(veces === 1 ? 'Ya lo pediste antes' : `Lo pediste ${veces} veces`);
    }

    // Favoritos
    if (p.id && favoritos.has(p.id)) {
      score += 3;
      razones.push('Está en tus favoritos');
    }

    if (razones.length === 0) razones.push('Opción variada del menú');

    return { producto: p, score, razones };
  }

  private puntuarObjetivo(
    p: Producto,
    perfil: PerfilNutricional,
    tags: string,
    razones: string[],
  ): number {
    let s = 0;
    const cal = p.calorias;
    const esLigero = ['ensalada', 'bowl', 'light', 'verdura', 'vegetal'].some((k) =>
      tags.includes(k),
    );
    const esProteico = ['proteína', 'protein', 'pollo', 'carne', 'res', 'huevo', 'bowl'].some((k) =>
      tags.includes(k),
    );

    switch (perfil.objetivoNutricional) {
      case 'Perder peso':
      case 'Alimentación saludable':
        if (cal != null && cal <= 500) {
          s += 2;
          razones.push('Bajo en calorías');
        }
        if (esLigero) {
          s += 1;
          razones.push('Ligero y saludable');
        }
        break;
      case 'Ganar masa muscular':
        if (esProteico) {
          s += 2;
          razones.push('Alto en proteína');
        }
        if (cal != null && cal >= 600) {
          s += 1;
          razones.push('Buen aporte calórico');
        }
        break;
      case 'Mejorar energía':
        if (cal != null && cal >= 400 && cal <= 700) {
          s += 1;
          razones.push('Energía balanceada');
        }
        break;
      case 'Mantener peso':
      default:
        break;
    }
    return s;
  }

  private tieneConflicto(p: Producto, perfil: PerfilNutricional): boolean {
    const alergias = (perfil.alergias ?? []).map((a) => a.toLowerCase());
    const restricciones = (perfil.restriccionesDieteticas ?? []).map((r) => r.toLowerCase());
    const ingredientes = (p.ingredientes ?? []).map((i) => i.toLowerCase()).join(' ');
    const texto = [p.nombre, p.descripcion, ...(p.etiquetas ?? [])].join(' ').toLowerCase();

    if (alergias.some((a) => ingredientes.includes(a) || texto.includes(a))) return true;
    return restricciones.some((r) => {
      const termino = r.replace(/^sin\s+|^bajo en\s+/i, '');
      return ingredientes.includes(termino) || texto.includes(termino);
    });
  }

  // ── Construye los días con variedad (cada día arranca con otro plato) ──
  private construirDias(ranking: SugerenciaPlato[], diasCount: number): DiaPlan[] {
    const dias: DiaPlan[] = [];
    const hoy = new Date();

    for (let i = 0; i < diasCount; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);

      let opciones: SugerenciaPlato[] = [];
      if (ranking.length > 0) {
        const offset = i % ranking.length;
        // Rota el ranking para que el plato principal cambie cada día
        opciones = [...ranking.slice(offset), ...ranking.slice(0, offset)];
      }

      dias.push({
        fecha: this.toYMD(fecha),
        nombreDia: DIAS_NOMBRE[fecha.getDay()],
        opciones,
        indice: 0,
        aceptado: false,
        programado: false,
      });
    }
    return dias;
  }

  // ── Lecturas de Firestore ───────────────────────────────────────────
  private async getProductosDisponibles(): Promise<Producto[]> {
    const snap = await getDocs(collection(db, 'productos'));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Producto)
      .filter((p) => p.disponible !== false);
  }

  private async getFrecuenciaPedidos(uid: string): Promise<Map<string, number>> {
    const freq = new Map<string, number>();
    const q = query(collection(db, 'pedidos'), where('clienteId', '==', uid));
    const snap = await getDocs(q);
    snap.docs.forEach((d) => {
      const items = (d.data()['items'] ?? []) as { nombre?: string; cantidad?: number }[];
      items.forEach((it) => {
        const nombre = (it.nombre ?? '').toLowerCase().trim();
        if (!nombre) return;
        freq.set(nombre, (freq.get(nombre) ?? 0) + (it.cantidad ?? 1));
      });
    });
    return freq;
  }

  private async getFavoritos(uid: string): Promise<Set<string>> {
    const ids = new Set<string>();
    const q = query(collection(db, 'favoritos'), where('uid', '==', uid));
    const snap = await getDocs(q);
    snap.docs.forEach((d) => {
      const pid = d.data()['productoId'] as string | undefined;
      if (pid) ids.add(pid);
    });
    return ids;
  }

  private toYMD(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dia}`;
  }
}
