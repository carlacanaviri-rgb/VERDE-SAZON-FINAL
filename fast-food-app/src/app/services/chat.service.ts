import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { Observable, firstValueFrom, timeout } from 'rxjs';
import { Mensaje, CrearMensajeRequest, CrearMensajeResponse } from '../models/mensaje.model';
import { environment } from '../../environments/environment';
import { getFirebaseApp } from './firebase-app';

const API = environment.apiUrl;
const MENSAJE_TIMEOUT_MS = 15000;

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private unsubscribers: Map<string, Unsubscribe> = new Map();

  /**
   * Obtiene los mensajes en tiempo real de un pedido
   * @param pedidoId ID del pedido
   * @returns Observable con los mensajes del pedido
   */
  getMensajes(pedidoId: string): Observable<Mensaje[]> {
    return new Observable((observer) => {
      const db = getFirestore(getFirebaseApp());
      const ref = collection(db, 'pedidos', pedidoId, 'mensajes');
      const q = query(ref, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log(`Mensajes encontrados para pedido ${pedidoId}:`, snapshot.docs.length);
          const mensajes = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          } as Mensaje));
          observer.next(mensajes);
        },
        (error) => {
          console.error(`Error leyendo mensajes del pedido ${pedidoId}:`, error);
          observer.error(error);
        },
      );

      return () => {
        unsubscribe();
      };
    });
  }

  /**
   * Envía un nuevo mensaje
   * @param mensaje Datos del mensaje a enviar
   * @returns Promise con la respuesta del servidor
   */
  async enviarMensaje(
    mensaje: CrearMensajeRequest,
  ): Promise<CrearMensajeResponse> {
    return firstValueFrom(
      this.http
        .post<CrearMensajeResponse>(`${API}/pedidos/${mensaje.pedidoId}/mensajes`, mensaje)
        .pipe(timeout(MENSAJE_TIMEOUT_MS)),
    );
  }

  /**
   * Marca un mensaje como leído
   * @param pedidoId ID del pedido
   * @param mensajeId ID del mensaje
   * @returns Promise que se resuelve cuando se marca como leído
   */
  async marcarComoLeido(pedidoId: string, mensajeId: string): Promise<void> {
    return firstValueFrom(
      this.http
        .patch<void>(`${API}/pedidos/${pedidoId}/mensajes/${mensajeId}`, { estado: 'leído' })
        .pipe(timeout(MENSAJE_TIMEOUT_MS)),
    );
  }

  /**
   * Limpia las suscripciones cuando se destruye el componente
   * @param pedidoId ID del pedido
   */
  limpiarSuscripcion(pedidoId: string): void {
    const unsubscribe = this.unsubscribers.get(pedidoId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribers.delete(pedidoId);
    }
  }

  /**
   * Limpia todas las suscripciones
   */
  limpiarTodasLasSuscripciones(): void {
    this.unsubscribers.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.unsubscribers.clear();
  }
}


