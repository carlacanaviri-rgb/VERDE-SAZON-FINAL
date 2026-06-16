import { Injectable } from '@angular/core';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseApp } from './firebase-app';
import { Observable } from 'rxjs';
import { EventoCalendario, ItemCalendario } from '../models/calendario.model';

const db = getFirestore(getFirebaseApp());

@Injectable({ providedIn: 'root' })
export class CalendarioService {
  /** Escucha en tiempo real todos los eventos del usuario */
  getEventos(uid: string): Observable<EventoCalendario[]> {
    return new Observable((observer) => {
      const ref = collection(db, 'calendario_pedidos');
      const q = query(ref, where('uid', '==', uid), orderBy('fecha', 'asc'));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const eventos = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EventoCalendario);
          observer.next(eventos);
        },
        (err) => {
          console.error('[CalendarioService] Error:', err);
          observer.error(err);
        },
      );
      return () => unsub();
    });
  }

  /** Crea un evento nuevo */
  async crearEvento(
    uid: string,
    evento: Omit<EventoCalendario, 'id' | 'uid' | 'creadoEn' | 'actualizadoEn'>,
  ): Promise<string> {
    const ahora = new Date().toISOString();
    const ref = collection(db, 'calendario_pedidos');
    const docRef = await addDoc(ref, {
      ...evento,
      uid,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });
    return docRef.id;
  }

  /** Actualiza un evento existente */
  async actualizarEvento(id: string, cambios: Partial<EventoCalendario>): Promise<void> {
    const ref = doc(db, 'calendario_pedidos', id);
    await updateDoc(ref, { ...cambios, actualizadoEn: new Date().toISOString() });
  }

  /** Elimina un evento */
  async eliminarEvento(id: string): Promise<void> {
    await deleteDoc(doc(db, 'calendario_pedidos', id));
  }

  /**
   * Importa el historial de pedidos reales del usuario como eventos de tipo 'historial'.
   * Solo importa los que no han sido importados antes.
   */
  async importarHistorialPedidos(uid: string): Promise<number> {
    // Obtener eventos historial ya importados
    const refCal = collection(db, 'calendario_pedidos');
    const qExist = query(refCal, where('uid', '==', uid), where('tipo', '==', 'historial'));
    const existSnap = await getDocs(qExist);
    const yaImportados = new Set(
      existSnap.docs.map((d) => d.data()['pedidoId'] as string).filter(Boolean),
    );

    // Obtener pedidos reales
    const refPedidos = collection(db, 'pedidos');
    const qPedidos = query(refPedidos, where('clienteId', '==', uid));
    const pedidosSnap = await getDocs(qPedidos);

    let importados = 0;
    const ahora = new Date().toISOString();

    for (const pedidoDoc of pedidosSnap.docs) {
      if (yaImportados.has(pedidoDoc.id)) continue;
      const p = pedidoDoc.data();

      // Extraer fecha de creadoEn (ISO string) o pagadoEn
      const fechaRaw: string = p['creadoEn'] ?? p['pagadoEn'] ?? ahora;
      const fechaDate = new Date(fechaRaw);
      // Fecha LOCAL 'YYYY-MM-DD' (no toISOString, que la pasa a UTC y puede
      // correr el día en husos negativos como UTC-4).
      const fecha = `${fechaDate.getFullYear()}-${String(fechaDate.getMonth() + 1).padStart(2, '0')}-${String(fechaDate.getDate()).padStart(2, '0')}`;
      const hora = p['hora'] ?? fechaDate.toTimeString().slice(0, 5);

      const items: ItemCalendario[] = (p['items'] ?? []).map((it: any) => ({
        nombre: it['nombre'] ?? '',
        cantidad: it['cantidad'] ?? 1,
        precio: it['precio'] ?? 0,
      }));

      await addDoc(refCal, {
        uid,
        tipo: 'historial',
        titulo: `Pedido #${p['numero'] ?? pedidoDoc.id.slice(0, 6)}`,
        fecha,
        hora,
        items,
        total: p['total'] ?? 0,
        estado: p['estado'] === 'entregado' ? 'entregado' : 'confirmado',
        nota: p['notaGeneral'] ?? '',
        direccionEntrega: p['direccionEntrega'] ?? '',
        pedidoId: pedidoDoc.id,
        pedidoNumero: p['numero'] ?? '',
        creadoEn: ahora,
        actualizadoEn: ahora,
      } as Omit<EventoCalendario, 'id'>);
      importados++;
    }
    return importados;
  }
}
