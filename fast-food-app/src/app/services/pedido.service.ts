import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { Observable, firstValueFrom, timeout } from 'rxjs';
import { CrearPedidoRequest, CrearPedidoResponse, Pedido, PedidoHistorialItem } from '../models/pedido.model';
import { environment } from '../../environments/environment';
import { getFirebaseApp } from './firebase-app';

const API = environment.apiUrl;
const PEDIDO_TIMEOUT_MS = 15000;

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private http = inject(HttpClient);

  getPedidos(): Observable<Pedido[]> {
    return new Observable(observer => {
      const db = getFirestore(getFirebaseApp());
      const ref = collection(db, 'pedidos');
      return onSnapshot(ref, snapshot => {
        console.log('Pedidos encontrados:', snapshot.docs.length);
        const pedidos = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Pedido));
        console.log('Pedidos:', pedidos);
        observer.next(pedidos);
      }, error => {
        console.error('Error leyendo pedidos:', error);
      });
    });
  }

  async cambiarEstado(id: string, estado: 'pendiente' | 'preparando' | 'listo' | 'entregado') {
    await this.http.patch(`${API}/pedidos/${id}/estado`, { estado }).toPromise();
  }

  async createPedido(payload: CrearPedidoRequest): Promise<CrearPedidoResponse> {
    return firstValueFrom(
      this.http.post<CrearPedidoResponse>(`${API}/pedidos`, payload).pipe(
        timeout(PEDIDO_TIMEOUT_MS)
      )
    );
  }

  getPedidosPorCliente(clienteId: string): Observable<PedidoHistorialItem[]> {
    return this.http.get<PedidoHistorialItem[]>(`${API}/pedidos/cliente/${clienteId}`).pipe(
      timeout(PEDIDO_TIMEOUT_MS)
    );
  }
}
