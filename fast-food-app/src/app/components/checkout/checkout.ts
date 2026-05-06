import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription, TimeoutError } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { FirestoreSyncError, FirestoreSyncTimeoutError, PedidoEstadoRealtime, PedidoService } from '../../services/pedido.service';
import { CoberturaService } from '../../services/cobertura.service';
import { CarritoItem } from '../../models/carrito-item.model';
import { CrearPedidoRequest, CrearPedidoResponse } from '../../models/pedido.model';
import { ZonaCobertura } from '../../models/zona-cobertura.model';
import { BolivianoCurrencyPipe } from '../../shared/pipes/boliviano-currency.pipe';

const CHECKOUT_QR_SESSION_KEY = 'verde-sazon-checkout-qr';

interface CheckoutQrSession {
  pedidoCreado: CrearPedidoResponse;
  nombreUsuario: string;
  emailUsuario: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, BolivianoCurrencyPipe],
  templateUrl: './checkout.html'
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private readonly cartSvc = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly pedidoSvc = inject(PedidoService);
  private readonly coberturaSvc = inject(CoberturaService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  paso: 'resumen' | 'confirmacion' | 'resultado' = 'resumen';
  carritoItems: CarritoItem[] = [];
  notaPedido = '';
  procesandoPedido = false;
  confirmandoPago = false;
  pagoConfirmado = false;
  esperandoConfirmacionPago = false;
  errorCheckout = '';
  avisoCheckout = '';
  pedidoCreado: CrearPedidoResponse | null = null;
  nombreUsuario = '';
  emailUsuario = '';
  direccionEntrega = '';
  referenciaEntrega = '';
  latEntrega = '';
  lngEntrega = '';
  zonaCoberturaDetectada = '';
  zonasCobertura: ZonaCobertura[] = [];
  sugerenciasCobertura: string[] = [];
  coberturaValida = false;
  errorCobertura = '';
  private seguimientoPagoSub: Subscription | null = null;

  get totalCarrito(): number {
    return this.carritoItems.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  }

  get cantidadCarrito(): number {
    return this.carritoItems.reduce((acc, item) => acc + item.cantidad, 0);
  }

  get puedeConfirmarPedido(): boolean {
    return !!this.direccionEntrega.trim() && this.coberturaValida && !this.procesandoPedido;
  }

  get latEntregaNumero(): number | undefined {
    const value = Number(this.latEntrega);
    return Number.isFinite(value) ? value : undefined;
  }

  get lngEntregaNumero(): number | undefined {
    const value = Number(this.lngEntrega);
    return Number.isFinite(value) ? value : undefined;
  }

  get referenciaPago(): string {
    if (!this.pedidoCreado) {
      return '';
    }
    return this.pedidoCreado.pago?.referencia
      || `${this.pedidoCreado.numero}|BOB|${this.pedidoCreado.total}|${this.nombreUsuario || this.emailUsuario || 'cliente'}`;
  }

  get pagoUrl(): string {
    return this.pedidoCreado?.pago?.paymentUrl ?? '';
  }

  get qrPagoContenido(): string {
    if (!this.pedidoCreado) {
      return '';
    }

    return this.pedidoCreado.pago?.qrData || this.pagoUrl || this.referenciaPago;
  }

  get qrPagoUrl(): string {
    if (!this.qrPagoContenido) {
      return '';
    }
    return `https://quickchart.io/qr?size=220&text=${encodeURIComponent(this.qrPagoContenido)}`;
  }

  ngOnInit(): void {
    this.cartSvc.items$.subscribe(items => {
      this.carritoItems = items;
    });

    this.auth.usuario$.subscribe(user => {
      this.nombreUsuario = user?.displayName ?? 'Cliente';
      this.emailUsuario = user?.email ?? '';
    });

    this.coberturaSvc.getZonasCobertura().subscribe({
      next: zonas => {
        this.zonasCobertura = zonas;
        this.errorCobertura = '';
        this.validarCoberturaDireccion();
      },
      error: () => {
        this.zonasCobertura = [];
        this.coberturaValida = false;
        this.zonaCoberturaDetectada = '';
        this.sugerenciasCobertura = [];
        this.errorCobertura = this.t(
          'CHECKOUT.ERROR_COVERAGE_UNAVAILABLE',
          undefined,
          'No se pudo cargar la cobertura en este momento.'
        );
      }
    });

    if (this.router.url.startsWith('/checkout/qr')) {
      this.restaurarSesionQr();
    }
  }

  ngOnDestroy(): void {
    this.detenerSeguimientoPago();
  }

  volverAMenu(): void {
    this.detenerSeguimientoPago();
    this.limpiarSesionQr();
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

    if (!this.validarCoberturaAntesDeContinuar()) {
      return;
    }

    this.paso = 'confirmacion';
  }

  volverAResumen(): void {
    this.errorCheckout = '';
    this.paso = 'resumen';
  }

  cambiarDireccion(): void {
    this.paso = 'resumen';
    this.errorCheckout = '';
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
    this.avisoCheckout = '';

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

    if (!this.validarCoberturaAntesDeContinuar()) {
      this.paso = 'resumen';
      return;
    }

    const payload: CrearPedidoRequest = {
      clienteId: usuario.uid,
      clienteNombre: this.nombreUsuario || usuario.displayName || 'Cliente',
      clienteEmail: this.emailUsuario || usuario.email || '',
      direccionEntrega: this.direccionEntrega.trim(),
      referenciaEntrega: this.referenciaEntrega.trim(),
      zonaCobertura: this.zonaCoberturaDetectada,
      latEntrega: this.latEntregaNumero,
      lngEntrega: this.lngEntregaNumero,
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
      this.pagoConfirmado = response.estado === 'pendiente';
      this.esperandoConfirmacionPago = !this.pagoConfirmado;
      this.paso = 'resultado';
      this.guardarSesionQr();

      if (this.esperandoConfirmacionPago) {
        this.iniciarSeguimientoPago(response.id);
      }

      this.cartSvc.clear();
      this.notaPedido = '';
      this.direccionEntrega = '';
      this.referenciaEntrega = '';
      this.latEntrega = '';
      this.lngEntrega = '';
      this.zonaCoberturaDetectada = '';
      this.sugerenciasCobertura = [];
      this.coberturaValida = false;

      await this.router.navigate(['/checkout/qr']);

      void this.pedidoSvc.confirmarPersistenciaFirestore(response.id).catch(error => {
        this.avisoCheckout = this.resolverMensajeAvisoFirestore(error);
        this.guardarSesionQr();
      });
    } catch (error) {
      this.errorCheckout = this.resolverMensajeErrorPedido(error);
    } finally {
      this.procesandoPedido = false;
    }
  }

  async confirmarPagoManual(): Promise<void> {
    if (!this.pedidoCreado || this.pagoConfirmado || this.confirmandoPago) {
      return;
    }

    this.confirmandoPago = true;
    this.errorCheckout = '';

    try {
      await this.pedidoSvc.confirmarPago(this.pedidoCreado.id);

      this.pagoConfirmado = true;
      this.esperandoConfirmacionPago = false;

      this.detenerSeguimientoPago();
      this.limpiarSesionQr();

      await this.router.navigate(['/menu']);
    } catch {
      this.errorCheckout = this.t(
        'CHECKOUT.ERROR_CONFIRM_PAYMENT',
        undefined,
        'No se pudo confirmar el pago. Intenta nuevamente en unos segundos.'
      );
    } finally {
      this.confirmandoPago = false;
    }
  }

  abrirPagoExterno(): void {
    if (!this.pagoUrl || typeof window === 'undefined') {
      return;
    }
    window.open(this.pagoUrl, '_blank', 'noopener');
  }

  private iniciarSeguimientoPago(pedidoId: string): void {
    this.detenerSeguimientoPago();

    this.avisoCheckout = this.t(
      'CHECKOUT.PAYMENT_WAITING_CONFIRMATION',
      undefined,
      'Esperando confirmacion automatica del pago QR...'
    );

    this.seguimientoPagoSub = this.pedidoSvc.escucharPedido(pedidoId).subscribe({
      next: snapshot => {
        if (!this.esPagoConfirmado(snapshot)) {
          return;
        }

        this.pagoConfirmado = true;
        this.esperandoConfirmacionPago = false;

        if (this.pedidoCreado) {
          this.pedidoCreado = {
            ...this.pedidoCreado,
            estado: 'pendiente'
          };
        }

        this.avisoCheckout = this.t(
          'CHECKOUT.PAYMENT_CONFIRMED_KITCHEN',
          undefined,
          'Pago confirmado. Tu pedido ya fue enviado a cocina y quedo en pendiente.'
        );
        this.guardarSesionQr();
        this.detenerSeguimientoPago();
      },
      error: () => {
        this.esperandoConfirmacionPago = false;
        this.avisoCheckout = this.t(
          'CHECKOUT.PAYMENT_WAITING_RETRY',
          undefined,
          'No pudimos escuchar la confirmacion de pago en tiempo real. Actualiza la pagina en unos segundos.'
        );
        this.guardarSesionQr();
      }
    });
  }

  private esPagoConfirmado(snapshot: PedidoEstadoRealtime | null): boolean {
    if (!snapshot) {
      return false;
    }

    return snapshot.pagoEstado === 'pagado' || snapshot.estado === 'pendiente';
  }

  private detenerSeguimientoPago(): void {
    if (this.seguimientoPagoSub) {
      this.seguimientoPagoSub.unsubscribe();
      this.seguimientoPagoSub = null;
    }
  }

  private resolverMensajeAvisoFirestore(error: unknown): string {
    if (error instanceof FirestoreSyncTimeoutError) {
      return this.t(
        'CHECKOUT.WARNING_FIREBASE_TIMEOUT',
        undefined,
        'Tu pedido fue creado, pero Firebase todavia esta sincronizando la informacion.'
      );
    }

    if (error instanceof FirestoreSyncError) {
      return this.t(
        'CHECKOUT.WARNING_FIREBASE_SYNC',
        undefined,
        'Tu pedido fue creado, pero hubo demora validando la sincronizacion en Firebase.'
      );
    }

    return this.t(
      'CHECKOUT.WARNING_FIREBASE_SYNC',
      undefined,
      'Tu pedido fue creado, pero hubo demora validando la sincronizacion en Firebase.'
    );
  }

  validarCoberturaDireccion(): void {
    const direccion = this.direccionEntrega.trim();

    if (!direccion) {
      this.coberturaValida = false;
      this.zonaCoberturaDetectada = '';
      this.sugerenciasCobertura = [];
      return;
    }

    if (this.zonasCobertura.length === 0) {
      this.coberturaValida = false;
      this.zonaCoberturaDetectada = '';
      this.sugerenciasCobertura = [];
      return;
    }

    const validacion = this.coberturaSvc.validarDireccion(direccion, this.zonasCobertura);
    this.coberturaValida = validacion.enCobertura;
    this.zonaCoberturaDetectada = validacion.zona ?? '';
    this.sugerenciasCobertura = this.coberturaValida
      ? []
      : this.coberturaSvc.sugerirZonasCercanas(direccion, this.zonasCobertura);
  }

  private validarCoberturaAntesDeContinuar(): boolean {
    this.validarCoberturaDireccion();

    if (!this.direccionEntrega.trim()) {
      this.errorCheckout = this.t(
        'CHECKOUT.ERROR_ADDRESS_REQUIRED',
        undefined,
        'Ingresa la direccion de entrega para continuar.'
      );
      return false;
    }

    if (this.errorCobertura) {
      this.errorCheckout = this.errorCobertura;
      return false;
    }

    if (!this.coberturaValida) {
      this.errorCheckout = this.t(
        'CHECKOUT.ERROR_OUT_OF_COVERAGE',
        undefined,
        'La direccion ingresada no esta dentro de la zona de cobertura.'
      );
      return false;
    }

    return true;
  }

  private resolverMensajeErrorPedido(error: unknown): string {
    if (error instanceof FirestoreSyncTimeoutError) {
      return this.t(
        'CHECKOUT.ERROR_FIREBASE_TIMEOUT',
        undefined,
        'El pedido se envio, pero Firebase no lo confirmo a tiempo. Intenta nuevamente.'
      );
    }

    if (error instanceof FirestoreSyncError) {
      return this.t(
        'CHECKOUT.ERROR_FIREBASE_SYNC',
        undefined,
        'No se pudo validar el pedido en Firebase. Revisa tu conexion e intenta otra vez.'
      );
    }

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

  private restaurarSesionQr(): void {
    const session = this.leerSesionQr();
    if (!session) {
      this.paso = 'resumen';
      void this.router.navigate(['/checkout']);
      return;
    }

    this.pedidoCreado = session.pedidoCreado;
    this.nombreUsuario = session.nombreUsuario || this.nombreUsuario;
    this.emailUsuario = session.emailUsuario || this.emailUsuario;
    this.paso = 'resultado';
    this.pagoConfirmado = session.pedidoCreado.estado === 'pendiente';
    this.esperandoConfirmacionPago = !this.pagoConfirmado;
    this.avisoCheckout = this.pagoConfirmado
      ? this.t(
        'CHECKOUT.PAYMENT_CONFIRMED_KITCHEN',
        undefined,
        'Pago confirmado. Tu pedido ya fue enviado a cocina y quedo en pendiente.'
      )
      : this.t(
        'CHECKOUT.PAYMENT_WAITING_CONFIRMATION',
        undefined,
        'Esperando confirmacion automatica del pago QR...'
      );

    if (this.esperandoConfirmacionPago) {
      this.iniciarSeguimientoPago(this.pedidoCreado.id);
    }
  }

  private guardarSesionQr(): void {
    if (!this.pedidoCreado || typeof sessionStorage === 'undefined') {
      return;
    }

    const session: CheckoutQrSession = {
      pedidoCreado: this.pedidoCreado,
      nombreUsuario: this.nombreUsuario,
      emailUsuario: this.emailUsuario
    };

    sessionStorage.setItem(CHECKOUT_QR_SESSION_KEY, JSON.stringify(session));
  }

  private leerSesionQr(): CheckoutQrSession | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }

    try {
      const raw = sessionStorage.getItem(CHECKOUT_QR_SESSION_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as Partial<CheckoutQrSession>;
      if (!parsed?.pedidoCreado?.id || !parsed?.pedidoCreado?.numero) {
        return null;
      }

      return {
        pedidoCreado: parsed.pedidoCreado,
        nombreUsuario: parsed.nombreUsuario ?? '',
        emailUsuario: parsed.emailUsuario ?? ''
      };
    } catch {
      return null;
    }
  }

  private limpiarSesionQr(): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    sessionStorage.removeItem(CHECKOUT_QR_SESSION_KEY);
  }

  private t(key: string, params?: Record<string, unknown>, fallback = ''): string {
    const translated = this.translate.instant(key, params);
    if (!translated || translated === key) {
      return fallback;
    }
    return translated;
  }
}

