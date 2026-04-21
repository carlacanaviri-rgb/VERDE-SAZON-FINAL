import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { AuthService } from '../../services/auth.service';
import { Pedido } from '../../models/pedido.model';
import { TranslateModule } from '@ngx-translate/core';
import { LangSwitchComponent } from '../lang-switch/lang-switch';


@Component({
  selector: 'app-cocina',
  standalone: true,
  imports: [CommonModule, TranslateModule, LangSwitchComponent],
  templateUrl: './cocina.html',
})
export class CocinaComponent implements OnInit {
  private svc = inject(PedidoService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  pedidos: Pedido[] = [];

  get pendientes() { return this.pedidos.filter(p => p.estado === 'pendiente'); }
  get preparando() { return this.pedidos.filter(p => p.estado === 'preparando'); }
  get listos() { return this.pedidos.filter(p => p.estado === 'listo'); }
  get entregados() { return this.pedidos.filter(p => p.estado === 'entregado'); }

  ngOnInit() {
    this.svc.getPedidos().subscribe(data => {
      this.pedidos = [...data];
      this.cdr.detectChanges();
    });
  }

  aceptar(p: Pedido) { this.svc.cambiarEstado(p.id!, 'preparando'); }
  marcarListo(p: Pedido) { this.svc.cambiarEstado(p.id!, 'listo'); }
  marcarEntregado(p: Pedido) { this.svc.cambiarEstado(p.id!, 'entregado'); }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
