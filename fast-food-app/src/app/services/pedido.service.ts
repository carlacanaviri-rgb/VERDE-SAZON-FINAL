import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { Observable, firstValueFrom, timeout, retry, from } from 'rxjs';
import {
  CrearPedidoRequest,
  CrearPedidoResponse,
  Pedido,
  PedidoHistorialItem,
} from '../models/pedido.model';
import { environment } from '../../environments/environment';
import { getFirebaseApp } from './firebase-app';

const API = environment.apiUrl;
const PEDIDO_TIMEOUT_MS = 60_000;
const FIRESTORE_SYNC_TIMEOUT_MS = 12000;

export interface PedidoEstadoRealtime {
  estado?: 'pendiente_pago' | 'pendiente' | 'preparando' | 'listo' | 'entregado';
  pagoEstado?: 'pendiente' | 'pagado';
}

export class FirestoreSyncError extends Error {
  constructor(message = 'No fue posible confirmar el pedido en Firebase.') {
    super(message);
    this.name = 'FirestoreSyncError';
  }
}

export class FirestoreSyncTimeoutError extends FirestoreSyncError {
  constructor(message = 'Firebase tardo demasiado en reflejar el pedido.') {
    super(message);
    this.name = 'FirestoreSyncTimeoutError';
  }
}

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private http = inject(HttpClient);

  getPedidos(): Observable<Pedido[]> {
    return new Observable((observer) => {
      const db = getFirestore(getFirebaseApp());
      const ref = collection(db, 'pedidos');

      // Cache de nombres para no releer usuarios en cada snapshot
      const nombresCache = new Map<string, string>();

      const enricher = async (pedidos: Pedido[]): Promise<Pedido[]> => {
        const idsSinNombre = [
          ...new Set(
            pedidos
              .map((p) => (p as any).clienteId as string | undefined)
              .filter((id): id is string => !!id && !nombresCache.has(id)),
          ),
        ];

        await Promise.all(
          idsSinNombre.map(async (uid) => {
            try {
              const { getDoc, doc: firestoreDoc } = await import('firebase/firestore');
              const snap = await getDoc(firestoreDoc(db, 'usuarios', uid));
              if (snap.exists()) {
                const data = snap.data() as any;
                nombresCache.set(uid, data['nombre'] ?? data['clienteNombre'] ?? uid);
              } else {
                nombresCache.set(uid, uid);
              }
            } catch {
              nombresCache.set(uid, uid);
            }
          }),
        );

        return pedidos.map((p) => {
          const cid = (p as any).clienteId as string | undefined;
          if (cid && nombresCache.has(cid)) {
            return {
              ...p,
              clienteId: cid,
              clienteNombre: nombresCache.get(cid) ?? p.clienteNombre,
            };
          }
          return p;
        });
      };

      return onSnapshot(
        ref,
        async (snapshot) => {
          const pedidos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Pedido);
          const enriched = await enricher(pedidos);
          observer.next(enriched);
        },
        (error) => {
          console.error('Error leyendo pedidos:', error);
        },
      );
    });
  }

  async cambiarEstado(
    id: string,
    estado:
      | 'pendiente_pago'
      | 'pendiente'
      | 'preparando'
      | 'listo'
      | 'recogido'
      | 'en_camino'
      | 'entregado',
  ) {
    await this.http.patch(`${API}/pedidos/${id}/estado`, { estado }).toPromise();
  }

  async confirmarPago(id: string): Promise<void> {
    await firstValueFrom(this.http.patch<void>(`${API}/pedidos/${id}/pago-confirmado`, {}));
  }

  escucharPedido(id: string): Observable<PedidoEstadoRealtime | null> {
    return new Observable((observer) => {
      const db = getFirestore(getFirebaseApp());
      const pedidoRef = doc(db, 'pedidos', id);

      return onSnapshot(
        pedidoRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            observer.next(null);
            return;
          }

          observer.next(snapshot.data() as PedidoEstadoRealtime);
        },
        (error) => {
          observer.error(error);
        },
      );
    });
  }

  async createPedido(payload: CrearPedidoRequest): Promise<CrearPedidoResponse> {
    return firstValueFrom(
      this.http
        .post<CrearPedidoResponse>(`${API}/pedidos`, payload)
        .pipe(timeout(PEDIDO_TIMEOUT_MS)),
    );
  }

  confirmarPersistenciaFirestore(pedidoId: string): Promise<void> {
    if (!pedidoId) {
      return Promise.reject(new FirestoreSyncError('El pedido no devolvio un id valido.'));
    }

    return new Promise<void>((resolve, reject) => {
      const db = getFirestore(getFirebaseApp());
      const pedidoRef = doc(db, 'pedidos', pedidoId);

      let unsubscribe: (() => void) | null = null;
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new FirestoreSyncTimeoutError());
      }, FIRESTORE_SYNC_TIMEOUT_MS);

      const cleanup = () => {
        clearTimeout(timeoutId);
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
      };

      unsubscribe = onSnapshot(
        pedidoRef,
        (snapshot) => {
          if (snapshot.exists()) {
            cleanup();
            resolve();
          }
        },
        (error) => {
          cleanup();
          reject(new FirestoreSyncError(error?.message || 'Error al leer el pedido en Firebase.'));
        },
      );
    });
  }

  getPedidosPorCliente(clienteId: string): Observable<PedidoHistorialItem[]> {
    return this.http.get<PedidoHistorialItem[]>(`${API}/pedidos/cliente/${clienteId}`).pipe(
      timeout(PEDIDO_TIMEOUT_MS),
      retry({ count: 2, delay: 3000 }), // 2 reintentos con 3s de espera
    );
  }

  /**
   * Obtiene el historial de pedidos del cliente directamente desde Firestore.
   * Sin orderBy para evitar requerir índice compuesto — se ordena en el cliente.
   */
  getPedidosPorClienteFirestore(clienteId: string): Observable<PedidoHistorialItem[]> {
    return from(
      (async (): Promise<PedidoHistorialItem[]> => {
        const db = getFirestore(getFirebaseApp());
        const ref = collection(db, 'pedidos');
        // Solo where, sin orderBy → no necesita índice compuesto
        const q = query(ref, where('clienteId', '==', clienteId));
        console.log('[PedidoService] Consultando pedidos de clienteId:', clienteId);
        const snapshot = await getDocs(q);
        console.log('[PedidoService] Pedidos encontrados:', snapshot.docs.length);
        const pedidos = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            numero: data['numero'] ?? '',
            estado: data['estado'] ?? 'pendiente',
            hora: data['hora'] ?? '',
            total: data['total'] ?? 0,
            creadoEn: data['creadoEn'] ?? '',
          } as PedidoHistorialItem;
        });
        // Ordenar por fecha descendente en el cliente
        return pedidos.sort((a, b) => (b.creadoEn ?? '').localeCompare(a.creadoEn ?? ''));
      })(),
    );
  }
}
