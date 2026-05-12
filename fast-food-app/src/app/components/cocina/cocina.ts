import { Component, inject, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { AuthService } from '../../services/auth.service';
import { Pedido } from '../../models/pedido.model';
import { TranslateModule } from '@ngx-translate/core';
import { LangSwitchComponent } from '../lang-switch/lang-switch';
import { ChatModalComponent } from '../chat-modal/chat-modal';

@Component({
  selector: 'app-cocina',
  standalone: true,
  imports: [CommonModule, TranslateModule, LangSwitchComponent, ChatModalComponent],
  templateUrl: './cocina.html',
})
export class CocinaComponent implements OnInit {
  private svc = inject(PedidoService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('chatModal') chatModal?: ChatModalComponent;

  pedidos: Pedido[] = [];

  private sortByArrival(list: Pedido[]): Pedido[] {
    return [...list].sort((a, b) => {
      const ta = (a as any).creadoEn ?? a.hora ?? '';
      const tb = (b as any).creadoEn ?? b.hora ?? '';
      return ta < tb ? -1 : ta > tb ? 1 : 0;
    });
  }

  get pendientes() {
    return this.sortByArrival(
      this.pedidos.filter((p) => p.estado === 'pendiente' || p.estado === 'pendiente_pago'),
    );
  }
  get preparando() {
    return this.sortByArrival(this.pedidos.filter((p) => p.estado === 'preparando'));
  }
  get listos() {
    return this.sortByArrival(this.pedidos.filter((p) => p.estado === 'listo'));
  }
  get entregados() {
    return this.sortByArrival(this.pedidos.filter((p) => p.estado === 'entregado'));
  }

  ngOnInit() {
    this.svc.getPedidos().subscribe((data) => {
      this.pedidos = [...data];
      this.cdr.detectChanges();
    });
  }

  aceptar(p: Pedido) {
    this.svc.cambiarEstado(p.id!, 'preparando');
  }
  marcarListo(p: Pedido) {
    this.svc.cambiarEstado(p.id!, 'listo');
  }
  marcarEntregado(p: Pedido) {
    this.svc.cambiarEstado(p.id!, 'entregado');
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Abre el modal de chat para un pedido específico
   */
  abrirChat(pedido: Pedido) {
    if (this.chatModal) {
      this.chatModal.abrir(pedido, 'cocina');
    }
  }
}
