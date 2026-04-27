import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { AuthService } from '../../services/auth.service';
import { Pedido } from '../../models/pedido.model';
import { BolivianoCurrencyPipe } from '../../shared/pipes/boliviano-currency.pipe';

@Component({
  selector: 'app-delivery',
  standalone: true,
  imports: [CommonModule, BolivianoCurrencyPipe],
  templateUrl: './delivery.html',
  styleUrls: ['./delivery.css'],
})
export class DeliveryComponent implements OnInit {
  private svc = inject(PedidoService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  pedidos: Pedido[] = [];
  procesando: { [id: string]: boolean } = {};

  readonly ESTADOS_ACTIVOS = ['listo', 'recogido', 'en_camino'];

  get activos(): Pedido[] {
    return this.pedidos.filter((p) => this.ESTADOS_ACTIVOS.includes(p.estado));
  }

  get completados(): Pedido[] {
    return this.pedidos.filter((p) => p.estado === 'entregado');
  }

  get totalGanado(): number {
    return this.completados.reduce((acc, p) => acc + (p.total ?? 0), 0);
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
    } catch (err) {
      console.error('Error cambiando estado:', err);
    } finally {
      this.procesando = { ...this.procesando, [id]: false };
      this.cdr.detectChanges();
    }
  }

  abrirMapa(pedido: Pedido): void {
    const dir = pedido.direccionEntrega ?? pedido.clienteNombre ?? '';
    if (!dir) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir)}`;
    window.open(url, '_blank', 'noopener');
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
