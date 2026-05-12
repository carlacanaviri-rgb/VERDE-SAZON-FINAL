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

  pedidoId = '';
  pedido: SeguimientoEstado | null = null;
  cargando = true;
  error = '';

  private unsub: (() => void) | null = null;

  readonly PASOS: Paso[] = [
    { key: 'pendiente', label: 'Pedido recibido', icon: '✓' },
    { key: 'preparando', label: 'En preparación', icon: '🍽' },
    { key: 'listo', label: 'Listo para despacho', icon: '📦' },
    { key: 'en_camino', label: 'En camino', icon: '🚚' },
    { key: 'entregado', label: 'Entregado', icon: '🎉' },
  ];

  // pendiente_pago también cuenta como "pedido recibido" para el display
  private readonly ORDEN = [
    'pendiente_pago',
    'pendiente',
    'preparando',
    'listo',
    'en_camino',
    'entregado',
  ];
  // Mapa de estado Firestore → índice en PASOS
  // recogido es intermedio entre listo(2) y en_camino(3) → lo mostramos como paso 3 "En camino" activo
  private readonly ESTADO_A_PASO: Record<string, number> = {
    pendiente_pago: 0,
    pendiente: 0,
    preparando: 1,
    listo: 2,
    recogido: 3, // repartidor recogió → mostrar "En camino" activo
    en_camino: 3,
    entregado: 4,
  };

  get indiceActual(): number {
    const estado = this.pedido?.estado ?? '';
    return this.ESTADO_A_PASO[estado] ?? -1;
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
      // Texto específico cuando el repartidor ya recogió pero aún no marcó en_camino
      if (paso.key === 'en_camino' && this.pedido?.estado === 'recogido') {
        return 'Repartidor en camino a ti...';
      }
      return 'En proceso...';
    }
    return 'Pendiente';
  }

  get estaEnCamino(): boolean {
    return this.pedido?.estado === 'en_camino';
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
        this.pedido = { id: snap.id, ...snap.data() } as SeguimientoEstado;
        this.cargando = false;
        this.error = '';
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

  abrirMapaRepartidor(): void {
    const lat = this.pedido?.latEntrega;
    const lng = this.pedido?.lngEntrega;
    const dir = this.pedido?.direccionEntrega ?? '';
    let url: string;
    if (lat && lng) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    } else if (dir) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir)}`;
    } else {
      return;
    }
    window.open(url, '_blank', 'noopener');
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
