import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { getFirestore, collection, doc, onSnapshot } from 'firebase/firestore';
import { Observable, firstValueFrom, timeout } from 'rxjs';
import {
  CrearPedidoRequest,
  CrearPedidoResponse,
  Pedido,
  PedidoHistorialItem,
} from '../models/pedido.model';
import { environment } from '../../environments/environment';
import { getFirebaseApp } from './firebase-app';

const API = environment.apiUrl;
const PEDIDO_TIMEOUT_MS = 15000;
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
      return onSnapshot(
        ref,
        (snapshot) => {
          console.log('Pedidos encontrados:', snapshot.docs.length);
          const pedidos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Pedido);
          console.log('Pedidos:', pedidos);
          observer.next(pedidos);
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
    return this.http
      .get<PedidoHistorialItem[]>(`${API}/pedidos/cliente/${clienteId}`)
      .pipe(timeout(PEDIDO_TIMEOUT_MS));
  }
}
