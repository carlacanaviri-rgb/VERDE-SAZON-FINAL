import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { Observable } from 'rxjs';
import { Pedido } from '../models/pedido.model';
import { environment } from '../../environments/environment';

const db = getFirestore(getApp());
const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private http = inject(HttpClient);

  getPedidos(): Observable<Pedido[]> {
    return new Observable(observer => {
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
}
