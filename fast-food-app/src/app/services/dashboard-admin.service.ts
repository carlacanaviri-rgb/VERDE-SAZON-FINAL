import { Injectable } from '@angular/core';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseApp } from './firebase-app';
import {
  ResumenAdmin,
  PlatoTop,
  UsuarioRecurrente,
  SegmentoPlan,
  ProgramadoDia,
} from '../models/dashboard-admin.model';

const db = getFirestore(getFirebaseApp());

@Injectable({ providedIn: 'root' })
export class DashboardAdminService {
  /** Construye todo el resumen del panel administrativo desde Firestore. */
  async getResumen(): Promise<ResumenAdmin> {
    const [usuarios, pedidos, programados] = await Promise.all([
      this.leerColeccion('usuarios'),
      this.leerColeccion('pedidos'),
      this.leerProgramados(),
    ]);

    // Solo clientes (no admin/cocina/delivery)
    const clientes = usuarios.filter((u) => (u['rol'] ?? 'cliente') === 'cliente');

    // ── Planes / segmentos por clasificacionCliente ───────────────
    const segMap = new Map<string, number>();
    clientes.forEach((u) => {
      const c = (u['clasificacionCliente'] ?? 'Sin clasificar') as string;
      segMap.set(c, (segMap.get(c) ?? 0) + 1);
    });
    const orden = ['Nuevo', 'Recurrente', 'VIP'];
    const segmentos: SegmentoPlan[] = [...segMap.entries()]
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => {
        const ia = orden.indexOf(a.nombre);
        const ib = orden.indexOf(b.nombre);
        if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        return b.cantidad - a.cantidad;
      });

    // ── Platos más solicitados (agrega items de todos los pedidos) ─
    const platoMap = new Map<string, { cantidad: number; ingresos: number }>();
    pedidos.forEach((p) => {
      const items = (p['items'] ?? []) as Record<string, unknown>[];
      items.forEach((it) => {
        const nombre = String(it['nombre'] ?? '').trim();
        if (!nombre) return;
        const cant = Number(it['cantidad'] ?? 1);
        const precio = Number(it['precio'] ?? 0);
        const cur = platoMap.get(nombre) ?? { cantidad: 0, ingresos: 0 };
        cur.cantidad += cant;
        cur.ingresos += precio * cant;
        platoMap.set(nombre, cur);
      });
    });
    const platosTop: PlatoTop[] = [...platoMap.entries()]
      .map(([nombre, v]) => ({ nombre, cantidad: v.cantidad, ingresos: v.ingresos }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 8);

    // ── Usuarios recurrentes ──────────────────────────────────────
    const usuariosRecurrentes: UsuarioRecurrente[] = clientes
      .map((u) => ({
        nombre: String(u['nombre'] ?? 'Sin nombre'),
        email: String(u['email'] ?? ''),
        clasificacion: String(u['clasificacionCliente'] ?? 'Nuevo'),
        pedidosCompletados: Number(u['pedidosCompletados'] ?? 0),
        montoTotalCompletado: Number(u['montoTotalCompletado'] ?? 0),
      }))
      .filter(
        (u) =>
          u.pedidosCompletados >= 2 ||
          u.clasificacion === 'Recurrente' ||
          u.clasificacion === 'VIP',
      )
      .sort((a, b) => b.pedidosCompletados - a.pedidosCompletados)
      .slice(0, 10);

    // ── Pedidos programados por día ───────────────────────────────
    const progMap = new Map<string, { cantidad: number; total: number }>();
    programados.forEach((e) => {
      const fecha = String(e['fecha'] ?? '');
      if (!fecha) return;
      const cur = progMap.get(fecha) ?? { cantidad: 0, total: 0 };
      cur.cantidad += 1;
      cur.total += Number(e['total'] ?? 0);
      progMap.set(fecha, cur);
    });
    const programadosPorDia: ProgramadoDia[] = [...progMap.entries()]
      .map(([fecha, v]) => ({ fecha, cantidad: v.cantidad, total: v.total }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    const ingresosTotales = pedidos.reduce((s, p) => s + Number(p['total'] ?? 0), 0);

    return {
      totalClientes: clientes.length,
      totalPedidos: pedidos.length,
      ingresosTotales,
      totalProgramados: programados.length,
      segmentos,
      platosTop,
      usuariosRecurrentes,
      programadosPorDia,
    };
  }

  // ── Lecturas defensivas ─────────────────────────────────────────
  private async leerColeccion(col: string): Promise<Record<string, unknown>[]> {
    try {
      const snap = await getDocs(collection(db, col));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error(`[DashboardAdmin] no se pudo leer '${col}':`, e);
      return [];
    }
  }

  private async leerProgramados(): Promise<Record<string, unknown>[]> {
    try {
      // Solo where → no requiere índice compuesto.
      const q = query(collection(db, 'calendario_pedidos'), where('tipo', '==', 'programado'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('[DashboardAdmin] no se pudo leer programados:', e);
      return [];
    }
  }
}
