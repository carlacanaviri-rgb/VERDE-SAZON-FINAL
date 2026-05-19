import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseApp } from '../../services/firebase-app';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { Mensaje } from '../../models/mensaje.model';
import { Pedido } from '../../models/pedido.model';
import { ChatModalComponent } from '../chat-modal/chat-modal';

export interface SeguimientoEstado {
  id?: string;
  numero?: string;
  estado?: string;
  hora?: string;
  tiempoEstimado?: number;
  clienteNombre?: string;
  clienteEmail?: string;
  direccionEntrega?: string;
  referenciaEntrega?: string;
  latEntrega?: number;
  lngEntrega?: number;
  creadoEn?: string;
  items?: { nombre: string; cantidad: number; precio?: number }[];
  total?: number;
}

interface Paso {
  key: string;
  label: string;
  icon: string;
}

// Centro de Cochabamba - Plaza 14 de Septiembre.
const RESTAURANTE_LAT = -17.3935;
const RESTAURANTE_LNG = -66.1568;
const RESTAURANTE_LABEL = 'Verde Sazon - Centro, Cochabamba';

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [CommonModule, ChatModalComponent],
  templateUrl: './seguimiento.html',
})
export class SeguimientoComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private chatService = inject(ChatService);
  private authService = inject(AuthService);

  @ViewChild(ChatModalComponent) chatModal?: ChatModalComponent;
  @ViewChild('mapaContainer') mapaContainer!: ElementRef;

  private mapaLeaflet?: L.Map;
  private markerDelivery?: L.Marker;
  private markerDestino?: L.Marker;
  private unsubUbicacion: (() => void) | null = null;

  pedidoId = '';
  pedido: SeguimientoEstado | null = null;
  cargando = true;
  error = '';
  mensajesNoLeidos = 0;
  ultimoMensajeCocina = '';
  mostrarAlertaChat = false;

  private mensajesActuales: Mensaje[] = [];
  private usuarioActualId = '';

  private unsub: (() => void) | null = null;
  private mensajesSub: Subscription | null = null;
  private authSub: Subscription | null = null;

  readonly PASOS: Paso[] = [
    { key: 'pendiente', label: 'Pedido recibido', icon: '1' },
    { key: 'preparando', label: 'En preparacion', icon: '2' },
    { key: 'listo', label: 'Listo para despacho', icon: '3' },
    { key: 'en_camino', label: 'En camino', icon: '4' },
    { key: 'entregado', label: 'Entregado', icon: '5' },
  ];

  private readonly ESTADO_A_PASO: Record<string, number> = {
    pendiente_pago: 0,
    pendiente: 0,
    preparando: 1,
    listo: 2,
    recogido: 3,
    en_camino: 3,
    entregado: 4,
  };

  get indiceActual(): number {
    return this.ESTADO_A_PASO[this.pedido?.estado ?? ''] ?? -1;
  }

  get progreso(): number {
    if (this.indiceActual < 0) return 0;
    return Math.round((this.indiceActual / (this.PASOS.length - 1)) * 100);
  }

  estadoPaso(paso: Paso): 'completado' | 'activo' | 'pendiente' {
    const idx = this.PASOS.indexOf(paso);
    if (idx < this.indiceActual) return 'completado';
    if (idx === this.indiceActual) return 'activo';
    return 'pendiente';
  }

  subLabelPaso(paso: Paso): string {
    const estado = this.estadoPaso(paso);
    if (estado === 'completado') return 'Completado';
    if (estado === 'activo') {
      if (paso.key === 'en_camino' && this.pedido?.estado === 'recogido') {
        return 'Repartidor recogio tu pedido...';
      }
      return 'En proceso...';
    }
    return 'Pendiente';
  }

  get mostrarMapa(): boolean {
    return ['recogido', 'en_camino', 'entregado'].includes(this.pedido?.estado ?? '');
  }

  get estaEntregado(): boolean {
    return this.pedido?.estado === 'entregado';
  }

  get tiempoRestante(): number {
    return this.pedido?.tiempoEstimado ?? 25;
  }

  ngOnInit(): void {
    this.authSub = this.authService.usuario$.subscribe((user) => {
      this.usuarioActualId = user?.uid ?? '';
    });

    this.pedidoId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.pedidoId) {
      this.error = 'No se especifico un pedido para rastrear.';
      this.cargando = false;
      this.cdr.detectChanges();
      return;
    }

    this.escucharPedido();
    this.escucharMensajesChat();
  }

  ngOnDestroy(): void {
    this.unsub?.();
    this.unsubUbicacion?.();
    this.mensajesSub?.unsubscribe();
    this.authSub?.unsubscribe();
  }

  abrirChatCliente(): void {
    if (!this.pedido) {
      return;
    }

    this.chatModal?.abrir(this.toPedidoChat(this.pedido), 'cliente');
    this.mostrarAlertaChat = false;
    this.marcarMensajesCocinaComoLeidos(this.mensajesActuales);
  }

  private escucharMensajesChat(): void {
    this.mensajesSub?.unsubscribe();
    this.mensajesSub = this.chatService.getMensajes(this.pedidoId).subscribe({
      next: (mensajes) => {
        this.mensajesActuales = mensajes;

        const mensajesCocina = mensajes.filter(
          (m) => m.rol === 'cocina' && m.autorId !== this.usuarioActualId,
        );
        const noLeidos = mensajesCocina.filter((m) => !this.esMensajeLeido(m.estado)).length;
        const ultimo = mensajesCocina[mensajesCocina.length - 1];

        if (noLeidos > this.mensajesNoLeidos) {
          this.mostrarAlertaChat = true;
        }

        this.mensajesNoLeidos = noLeidos;
        this.ultimoMensajeCocina = ultimo?.contenido ?? '';

        if (this.chatModal?.isOpen) {
          this.marcarMensajesCocinaComoLeidos(mensajes);
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('No se pudo escuchar el chat del pedido:', err);
      },
    });
  }

  private esMensajeLeido(estado?: string): boolean {
    const normalizado = (estado ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    return normalizado === 'leido';
  }

  private marcarMensajesCocinaComoLeidos(mensajes: Mensaje[]): void {
    const pendientes = mensajes.filter(
      (m) => m.rol === 'cocina' && !this.esMensajeLeido(m.estado) && !!m.id,
    );

    for (const msg of pendientes) {
      if (!msg.id) {
        continue;
      }
      void this.chatService.marcarComoLeido(this.pedidoId, msg.id);
    }
  }

  private toPedidoChat(pedido: SeguimientoEstado): Pedido {
    const estado = (pedido.estado ?? 'pendiente') as Pedido['estado'];
    return {
      id: pedido.id,
      numero: pedido.numero ?? this.pedidoId,
      estado,
      hora: pedido.hora ?? '',
      items:
        pedido.items?.map((item) => ({
          nombre: item.nombre,
          cantidad: item.cantidad,
          nota: '',
        })) ?? [],
      clienteNombre: pedido.clienteNombre,
      clienteEmail: pedido.clienteEmail,
      direccionEntrega: pedido.direccionEntrega,
      referenciaEntrega: pedido.referenciaEntrega,
      total: pedido.total,
      tiempoEstimado: pedido.tiempoEstimado,
    };
  }

  private escucharPedido(): void {
    const db = getFirestore(getFirebaseApp());
    const ref = doc(db, 'pedidos', this.pedidoId);

    this.unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          this.error = 'Pedido no encontrado.';
          this.cargando = false;
          this.cdr.detectChanges();
          return;
        }

        const prevEstado = this.pedido?.estado;
        this.pedido = { id: snap.id, ...snap.data() } as SeguimientoEstado;
        this.cargando = false;
        this.error = '';

        if (this.mostrarMapa && prevEstado !== this.pedido.estado) {
          this.iniciarMapaLeaflet();
        }

        this.cdr.detectChanges();
      },
      (err) => {
        this.cargando = false;
        this.error = 'No se pudo conectar con el servidor para rastrear el pedido.';
        console.error(err);
        this.cdr.detectChanges();
      },
    );
  }

  private iniciarMapaLeaflet(): void {
    setTimeout(() => {
      if (!this.mapaContainer) return;
      const el = this.mapaContainer.nativeElement;
      if ((el as { _leaflet_id?: unknown })._leaflet_id) return;

      const lat = this.pedido?.latEntrega ?? -17.3895;
      const lng = this.pedido?.lngEntrega ?? -66.1568;

      this.mapaLeaflet = L.map(el).setView([lat, lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'OpenStreetMap',
        maxZoom: 19,
      }).addTo(this.mapaLeaflet);

      if (this.pedido?.latEntrega && this.pedido?.lngEntrega) {
        const iconDestino = L.icon({
          iconUrl:
            'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });

        this.markerDestino = L.marker([this.pedido.latEntrega, this.pedido.lngEntrega], {
          icon: iconDestino,
        })
          .addTo(this.mapaLeaflet)
          .bindPopup('Tu ubicacion');
      }

      setTimeout(() => this.mapaLeaflet?.invalidateSize(), 300);
      this.escucharUbicacionDelivery();
    }, 400);
  }

  private escucharUbicacionDelivery(): void {
    if (!this.pedidoId || !this.mapaLeaflet) return;

    const db = getFirestore(getFirebaseApp());
    const ref = doc(db, 'ubicaciones_delivery', this.pedidoId);

    this.unsubUbicacion = onSnapshot(ref, (snap) => {
      if (!snap.exists() || !this.mapaLeaflet) return;

      const { lat, lng } = snap.data() as { lat: number; lng: number };

      const iconDelivery = L.icon({
        iconUrl:
          'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      if (this.markerDelivery) {
        this.markerDelivery.setLatLng([lat, lng]);
      } else {
        this.markerDelivery = L.marker([lat, lng], { icon: iconDelivery })
          .addTo(this.mapaLeaflet)
          .bindPopup('Repartidor');
      }

      if (this.pedido?.latEntrega && this.pedido?.lngEntrega) {
        const bounds = L.latLngBounds([lat, lng], [this.pedido.latEntrega, this.pedido.lngEntrega]);
        this.mapaLeaflet.fitBounds(bounds, { padding: [40, 40] });
      }

      this.cdr.detectChanges();
    });
  }

  abrirEnGoogleMaps(): void {
    const origen = `${RESTAURANTE_LAT},${RESTAURANTE_LNG}`;
    const destino =
      this.pedido?.latEntrega && this.pedido?.lngEntrega
        ? `${this.pedido.latEntrega},${this.pedido.lngEntrega}`
        : encodeURIComponent(
            this.pedido?.direccionEntrega
              ? `${this.pedido.direccionEntrega}, Cochabamba, Bolivia`
              : 'Cochabamba, Bolivia',
          );

    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${origen}&destination=${destino}&travelmode=driving`,
      '_blank',
      'noopener',
    );
  }

  llamarRepartidor(): void {
    alert('Funcion de llamada disponible cuando se integre el modulo de repartidores.');
  }

  contactarSoporte(): void {
    window.location.href = 'mailto:soporte@verdesazon.com';
  }

  volverAMenu(): void {
    this.router.navigate(['/menu']);
  }

  get restauranteLabel(): string {
    return RESTAURANTE_LABEL;
  }
}
