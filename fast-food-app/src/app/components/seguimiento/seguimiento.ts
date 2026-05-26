import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseApp } from '../../services/firebase-app';
import * as L from 'leaflet';

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

// ─── Ubicación del restaurante ───────────────────────────────────────────────
// Centro de Cochabamba — Plaza 14 de Septiembre
const RESTAURANTE_LAT = -17.3935;
const RESTAURANTE_LNG = -66.1568;
const RESTAURANTE_LABEL = 'Verde Sazón — Centro, Cochabamba';
// ────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seguimiento.html',
})
export class SeguimientoComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('mapaContainer') mapaContainer!: ElementRef;
  private mapaLeaflet!: L.Map;
  private markerDelivery!: L.Marker;
  private markerDestino!: L.Marker;
  private unsubUbicacion: (() => void) | null = null;

  pedidoId = '';
  pedido: SeguimientoEstado | null = null;
  cargando = true;
  error = '';
  mapaUrl: SafeResourceUrl | null = null;
  mapaListo = false;

  private unsub: (() => void) | null = null;

  readonly PASOS: Paso[] = [
    { key: 'pendiente', label: 'Pedido recibido', icon: '✓' },
    { key: 'preparando', label: 'En preparación', icon: '🍽' },
    { key: 'listo', label: 'Listo para despacho', icon: '📦' },
    { key: 'en_camino', label: 'En camino', icon: '🚚' },
    { key: 'entregado', label: 'Entregado', icon: '🎉' },
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
    const e = this.estadoPaso(paso);
    if (e === 'completado') return 'Completado';
    if (e === 'activo') {
      if (paso.key === 'en_camino' && this.pedido?.estado === 'recogido')
        return 'Repartidor recogió tu pedido...';
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
    this.pedidoId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.pedidoId) {
      this.error = 'No se especificó un pedido para rastrear.';
      this.cargando = false;
      this.cdr.detectChanges();
      return;
    }
    this.escucharPedido();
  }

  ngOnDestroy(): void {
    this.unsub?.();
    this.unsubUbicacion?.();
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

        // Construir el mapa solo la primera vez que entra a un estado con mapa
        if (this.mostrarMapa && prevEstado !== this.pedido.estado) {
          this.iniciarMapaLeaflet();
        }
        this.cdr.detectChanges();
      },
      (err) => {
        this.cargando = false;
        this.error = 'No se pudo conectar con el servidor.';
        console.error(err);
        this.cdr.detectChanges();
      },
    );
  }

  private iniciarMapaLeaflet(): void {
    setTimeout(() => {
      if (!this.mapaContainer) return;
      const el = this.mapaContainer.nativeElement;
      if ((el as any)._leaflet_id) return;

      // Coordenadas iniciales — restaurante
      const lat = this.pedido?.latEntrega ?? -17.3895;
      const lng = this.pedido?.lngEntrega ?? -66.1568;

      this.mapaLeaflet = L.map(el).setView([lat, lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(this.mapaLeaflet);

      // Pin destino (cliente) — rojo
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
          .bindPopup('📍 Tu ubicación');
      }

      setTimeout(() => this.mapaLeaflet.invalidateSize(), 300);

      // Escucha ubicación del delivery en tiempo real
      console.log('Escuchando ubicación para pedido:', this.pedidoId); // debug
      this.escucharUbicacionDelivery();
    }, 400);
  }

  private escucharUbicacionDelivery(): void {
    if (!this.pedidoId) return;
    const db = getFirestore(getFirebaseApp());
    const ref = doc(db, 'ubicaciones_delivery', this.pedidoId);

    this.unsubUbicacion = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const { lat, lng } = snap.data() as { lat: number; lng: number };

      const iconDelivery = L.icon({
        iconUrl:
          'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      if (this.markerDelivery) {
        // Mueve el pin suavemente
        this.markerDelivery.setLatLng([lat, lng]);
      } else {
        this.markerDelivery = L.marker([lat, lng], { icon: iconDelivery })
          .addTo(this.mapaLeaflet)
          .bindPopup('🚚 Repartidor');
      }

      // Centra el mapa entre delivery y destino
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
    alert('Función de llamada disponible cuando se integre el módulo de repartidores.');
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
