import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { AuthService } from '../../services/auth.service';
import { Pedido } from '../../models/pedido.model';
import { BolivianoCurrencyPipe } from '../../shared/pipes/boliviano-currency.pipe';

import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getFirebaseApp } from '../../services/firebase-app';

@Component({
  selector: 'app-delivery',
  standalone: true,
  imports: [CommonModule, BolivianoCurrencyPipe],
  templateUrl: './delivery.html',
  styleUrls: ['./delivery.css'],
})
export class DeliveryComponent implements OnInit, OnDestroy {
  private svc = inject(PedidoService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  pedidos: Pedido[] = [];
  procesando: { [id: string]: boolean } = {};

  readonly ESTADOS_ACTIVOS = ['listo', 'recogido', 'en_camino'];

  private trackingIntervals: { [pedidoId: string]: any } = {};

  ngOnDestroy(): void {
    // Limpia todos los intervalos al salir
    Object.values(this.trackingIntervals).forEach(clearInterval);
  }

  private sortByArrival(list: Pedido[]): Pedido[] {
    return [...list].sort((a, b) => {
      const ta = (a as any).creadoEn ?? a.hora ?? '';
      const tb = (b as any).creadoEn ?? b.hora ?? '';
      return ta < tb ? -1 : ta > tb ? 1 : 0;
    });
  }

  get activos(): Pedido[] {
    return this.sortByArrival(this.pedidos.filter((p) => this.ESTADOS_ACTIVOS.includes(p.estado)));
  }

  get completados(): Pedido[] {
    return this.sortByArrival(this.pedidos.filter((p) => p.estado === 'entregado'));
  }

  get totalGanado(): number {
    return this.completados.reduce((acc, p) => acc + (p.total ?? 0), 0);
  }
  get nombreRepartidor(): string {
    const u = this.auth.usuarioLogueado;
    return u?.displayName || u?.email?.split('@')[0] || 'Repartidor';
  }

  get inicialRepartidor(): string {
    return (this.nombreRepartidor.trim()[0] || 'R').toUpperCase();
  }

  get fechaHoy(): string {
    const d = new Date();
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]}`;
  }
  ngOnInit(): void {
    this.svc.getPedidos().subscribe((data) => {
      this.pedidos = [...data];
      this.cdr.detectChanges();
    });
  }

  getBadgeLabel(estado: string): string {
    const map: Record<string, string> = {
      listo: 'Asignado',
      recogido: 'Recogido',
      en_camino: 'En camino',
    };
    return map[estado] ?? estado;
  }

  getBadgeClass(estado: string): string {
    const map: Record<string, string> = {
      listo: 'badge-asignado',
      recogido: 'badge-recogido',
      en_camino: 'badge-en-camino',
    };
    return map[estado] ?? '';
  }

  getBotonLabel(estado: string): string {
    const map: Record<string, string> = {
      listo: 'Recoger pedido',
      recogido: 'Iniciar entrega',
      en_camino: 'Confirmar entrega',
    };
    return map[estado] ?? '';
  }

  getItemsResumen(pedido: Pedido): string {
    const total = pedido.items?.reduce((acc, i) => acc + i.cantidad, 0) ?? 0;
    return `${total} item${total !== 1 ? 's' : ''}`;
  }

  async avanzarEstado(pedido: Pedido): Promise<void> {
    if (!pedido.id || this.procesando[pedido.id]) return;

    const siguiente: Record<string, string> = {
      listo: 'recogido',
      recogido: 'en_camino',
      en_camino: 'entregado',
    };

    const nextEstado = siguiente[pedido.estado];
    if (!nextEstado) return;

    const id = pedido.id;
    this.procesando = { ...this.procesando, [id]: true };
    this.cdr.detectChanges();

    try {
      await this.svc.cambiarEstado(id, nextEstado as Pedido['estado']);

      // 👇 Inicia tracking cuando sale a entregar
      if (nextEstado === 'en_camino') {
        this.iniciarTracking(id);
      }
      // 👇 Detiene tracking cuando entrega
      if (nextEstado === 'entregado') {
        this.detenerTracking(id);
      }
    } catch (err) {
      console.error('Error cambiando estado:', err);
    } finally {
      this.procesando = { ...this.procesando, [id]: false };
      this.cdr.detectChanges();
    }
  }


  abrirMapa(pedido: Pedido): void {
    const destino = pedido.latEntrega && pedido.lngEntrega
      ? `${pedido.latEntrega},${pedido.lngEntrega}`
      : encodeURIComponent(pedido.direccionEntrega ?? 'Cochabamba, Bolivia');

    // Abre navegación desde ubicación actual del delivery
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const url = `https://www.google.com/maps/dir/?api=1` +
          `&origin=${latitude},${longitude}` +
          `&destination=${destino}` +
          `&travelmode=driving`;
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      () => {
        // Si no hay GPS, abre igual sin origen fijo
        const url = `https://www.google.com/maps/dir/?api=1&destination=${destino}&travelmode=driving`;
        window.location.href = url;
      }
    );
  }

  private iniciarTracking(pedidoId: string): void {
    if (this.trackingIntervals[pedidoId]) return; // ya está corriendo

    const db = getFirestore(getFirebaseApp());

    const publicarUbicacion = () => {
      console.log('📡 Obteniendo GPS...');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          console.log('✅ GPS obtenido:', latitude, longitude);
          try {
            await setDoc(
              doc(db, 'ubicaciones_delivery', pedidoId),
              { lat: latitude, lng: longitude, actualizadoEn: new Date().toISOString() },
              { merge: true }
            );
            console.log('✅ Ubicación publicada en Firebase');
          } catch (err) {
            console.error('❌ Error publicando ubicación:', err);
          }
        },
        (err) => {
          console.error('❌ Error GPS:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    publicarUbicacion(); // publica inmediatamente
    this.trackingIntervals[pedidoId] = setInterval(publicarUbicacion, 5000);
  }

  private detenerTracking(pedidoId: string): void {
    if (this.trackingIntervals[pedidoId]) {
      clearInterval(this.trackingIntervals[pedidoId]);
      delete this.trackingIntervals[pedidoId];
    }
  }

  contactarCliente(pedido: Pedido): void {
    if (pedido.clienteEmail) {
      window.location.href = `mailto:${pedido.clienteEmail}`;
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
