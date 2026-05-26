import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseApp } from '../../services/firebase-app';

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

// Coordenadas del restaurante — Centro de Cochabamba (Plaza 14 de Septiembre)
const RESTAURANTE_LAT   = -17.3935;
const RESTAURANTE_LNG   = -66.1568;
const RESTAURANTE_LABEL = 'Verde Sazón — Centro, Cochabamba';

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seguimiento.html',
})
export class SeguimientoComponent implements OnInit, OnDestroy {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr    = inject(ChangeDetectorRef);

  pedidoId = '';
  pedido: SeguimientoEstado | null = null;
  cargando = true;
  error    = '';

  private unsub: (() => void) | null = null;

  readonly PASOS: Paso[] = [
    { key: 'pendiente',  label: 'Pedido recibido',     icon: '✓'  },
    { key: 'preparando', label: 'En preparación',      icon: '🍽' },
    { key: 'listo',      label: 'Listo para despacho', icon: '📦' },
    { key: 'en_camino',  label: 'En camino',           icon: '🚚' },
    { key: 'entregado',  label: 'Entregado',           icon: '🎉' },
  ];

  private readonly ESTADO_A_PASO: Record<string, number> = {
    pendiente_pago: 0,
    pendiente:      0,
    preparando:     1,
    listo:          2,
    recogido:       3,
    en_camino:      3,
    entregado:      4,
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

  get restauranteLabel(): string {
    return RESTAURANTE_LABEL;
  }

  ngOnInit(): void {
    this.pedidoId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.pedidoId) {
      this.error    = 'No se especificó un pedido para rastrear.';
      this.cargando = false;
      this.cdr.detectChanges();
      return;
    }
    this.escucharPedido();
  }

  ngOnDestroy(): void {
    this.unsub?.();
  }

  private escucharPedido(): void {
    const db  = getFirestore(getFirebaseApp());
    const ref = doc(db, 'pedidos', this.pedidoId);

    this.unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          this.error    = 'Pedido no encontrado.';
          this.cargando = false;
          this.cdr.detectChanges();
          return;
        }
        this.pedido   = { id: snap.id, ...snap.data() } as SeguimientoEstado;
        this.cargando = false;
        this.error    = '';
        this.cdr.detectChanges();
      },
      (err) => {
        this.cargando = false;
        this.error    = 'No se pudo conectar con el servidor.';
        console.error(err);
        this.cdr.detectChanges();
      }
    );
  }

  abrirEnGoogleMaps(): void {
    const origen  = `${RESTAURANTE_LAT},${RESTAURANTE_LNG}`;
    const destino = (this.pedido?.latEntrega && this.pedido?.lngEntrega)
      ? `${this.pedido.latEntrega},${this.pedido.lngEntrega}`
      : encodeURIComponent(
        this.pedido?.direccionEntrega
          ? `${this.pedido.direccionEntrega}, Cochabamba, Bolivia`
          : 'Cochabamba, Bolivia'
      );
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${origen}&destination=${destino}&travelmode=driving`,
      '_blank', 'noopener'
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
}
