import { Injectable } from '@angular/core';
import { getFirestore, collection, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { Observable } from 'rxjs';
import { Pedido } from '../models/pedido.model';

const db = getFirestore(getApp());

@Injectable({ providedIn: 'root' })
export class PedidoService {

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

  async cambiarEstado(id: string, estado: 'pendiente' | 'preparando' | 'listo') {
    await updateDoc(doc(db, 'pedidos', id), { estado });
  }
}
