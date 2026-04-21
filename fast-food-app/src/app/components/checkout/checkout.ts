import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TimeoutError } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { PedidoService } from '../../services/pedido.service';
import { CarritoItem } from '../../models/carrito-item.model';
import { CrearPedidoRequest, CrearPedidoResponse } from '../../models/pedido.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './checkout.html'
})
export class CheckoutComponent implements OnInit {
  private readonly cartSvc = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly pedidoSvc = inject(PedidoService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  paso: 'resumen' | 'confirmacion' | 'resultado' = 'resumen';
  carritoItems: CarritoItem[] = [];
  notaPedido = '';
  procesandoPedido = false;
  errorCheckout = '';
  pedidoCreado: CrearPedidoResponse | null = null;
  nombreUsuario = '';
  emailUsuario = '';

  get totalCarrito(): number {
    return this.carritoItems.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  }

  get cantidadCarrito(): number {
    return this.carritoItems.reduce((acc, item) => acc + item.cantidad, 0);
  }

  ngOnInit(): void {
    this.cartSvc.items$.subscribe(items => {
      this.carritoItems = items;
    });

    this.auth.usuario$.subscribe(user => {
      this.nombreUsuario = user?.displayName ?? 'Cliente';
      this.emailUsuario = user?.email ?? '';
    });
  }

  volverAMenu(): void {
    this.router.navigate(['/menu']);
  }

  continuarAConfirmacion(): void {
    this.errorCheckout = '';

    if (this.carritoItems.length === 0) {
      this.errorCheckout = this.t(
        'CHECKOUT.ERROR_EMPTY_CART',
        undefined,
        'Agrega productos en tu carrito para continuar.'
      );
      return;
    }

    this.paso = 'confirmacion';
  }

  volverAResumen(): void {
    this.errorCheckout = '';
    this.paso = 'resumen';
  }

  incrementarCantidad(item: CarritoItem): void {
    this.cartSvc.incrementar(item.id);
  }

  decrementarCantidad(item: CarritoItem): void {
    this.cartSvc.decrementar(item.id);
  }

  quitarDelCarrito(item: CarritoItem): void {
    this.cartSvc.remove(item.id);
  }

  async confirmarPedido(): Promise<void> {
    const usuario = this.auth.usuarioLogueado;
    this.errorCheckout = '';

    if (!usuario) {
      this.errorCheckout = this.t(
        'CHECKOUT.ERROR_LOGIN_REQUIRED',
        undefined,
        'Tu sesion expiro. Inicia sesion nuevamente para completar tu pedido.'
      );
      this.router.navigate(['/login']);
      return;
    }

    if (this.carritoItems.length === 0) {
      this.errorCheckout = this.t(
        'CHECKOUT.ERROR_EMPTY_CART',
        undefined,
        'Agrega productos en tu carrito para continuar.'
      );
      this.paso = 'resumen';
      return;
    }

    const payload: CrearPedidoRequest = {
      clienteId: usuario.uid,
      clienteNombre: this.nombreUsuario || usuario.displayName || 'Cliente',
      clienteEmail: this.emailUsuario || usuario.email || '',
      notaGeneral: this.notaPedido.trim(),
      total: this.totalCarrito,
      items: this.carritoItems.map(item => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
        nota: '',
        precio: item.precio
      }))
    };

    this.procesandoPedido = true;

    try {
      const response = await this.pedidoSvc.createPedido(payload);
      this.pedidoCreado = response;
      this.cartSvc.clear();
      this.paso = 'resultado';
    } catch (error) {
      this.errorCheckout = this.resolverMensajeErrorPedido(error);
    } finally {
      this.procesandoPedido = false;
    }
  }

  private resolverMensajeErrorPedido(error: unknown): string {
    if (error instanceof TimeoutError) {
      return this.t(
        'CHECKOUT.ERROR_CREATE_ORDER',
        undefined,
        'La creacion del pedido tardó demasiado. Intenta nuevamente en unos segundos.'
      );
    }

    if (error instanceof HttpErrorResponse && error.status === 0) {
      return this.t(
        'CHECKOUT.ERROR_CREATE_ORDER',
        undefined,
        'No se pudo conectar con el backend local. Verifica que la API este activa.'
      );
    }

    return this.t(
      'CHECKOUT.ERROR_CREATE_ORDER',
      undefined,
      'No se pudo completar el pedido. Intenta nuevamente.'
    );
  }

  private t(key: string, params?: Record<string, unknown>, fallback = ''): string {
    const translated = this.translate.instant(key, params);
    if (!translated || translated === key) {
      return fallback;
    }
    return translated;
  }
}

