import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LangSwitchComponent } from '../lang-switch/lang-switch';
import { ClienteService } from '../../services/cliente.service';
import { CartService } from '../../services/cart.service';
import { CarritoItem } from '../../models/carrito-item.model';
import { PedidoService } from '../../services/pedido.service';
import { CrearPedidoRequest, PedidoHistorialItem } from '../../models/pedido.model';
import { TimeoutError } from 'rxjs';
import { CoberturaService } from '../../services/cobertura.service';
import { ZonaCobertura } from '../../models/zona-cobertura.model';
import { BolivianoCurrencyPipe } from '../../shared/pipes/boliviano-currency.pipe';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LangSwitchComponent, BolivianoCurrencyPipe],
  templateUrl: './menu.html',
})
export class MenuComponent implements OnInit {
  private svc = inject(ProductoService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private clienteSvc = inject(ClienteService);
  private cartSvc = inject(CartService);
  private pedidoSvc = inject(PedidoService);
  private coberturaSvc = inject(CoberturaService);
  private translate = inject(TranslateService);

  productos: Producto[] = [];
  categoriaActiva = 'Todas';
  mostrarDropdown = false;
  nombreUsuario = '';
  emailUsuario = '';
  clasificacionUsuario: 'Nuevo' | 'Recurrente' | 'VIP' = 'Nuevo';
  pedidosCompletados = 0;
  montoTotalCompletado = 0;
  mostrarCarrito = false;
  mensajeCarrito = '';
  carritoItems: CarritoItem[] = [];
  notaPedido = '';
  procesandoPedido = false;
  errorPedido = '';
  exitoPedido = '';
  mostrarModalExito = false;
  historialPedidos: PedidoHistorialItem[] = [];
  cargandoHistorial = false;
  errorHistorial = '';
  direccionEntrega = '';
  referenciaEntrega = '';
  latEntrega = '';
  lngEntrega = '';
  zonaCoberturaDetectada = '';
  zonasCobertura: ZonaCobertura[] = [];
  sugerenciasCobertura: string[] = [];
  coberturaValida = false;
  errorCobertura = '';

  get categorias(): string[] {
    const cats = this.productos.map((p) => p.categoria);
    return ['Todas', ...new Set(cats)];
  }

  get productosFiltrados(): Producto[] {
    const disponibles = this.productos.filter((p) => p.disponible);
    if (this.categoriaActiva === 'Todas') return disponibles;
    return disponibles.filter((p) => p.categoria === this.categoriaActiva);
  }

  get totalDisponibles(): number {
    return this.productos.filter((p) => p.disponible).length;
  }

  get cantidadCarrito(): number {
    return this.carritoItems.reduce((acc, item) => acc + item.cantidad, 0);
  }

  get totalCarrito(): number {
    return this.carritoItems.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  }

  get puedeComprar(): boolean {
    return this.cantidadCarrito > 0 && !!this.auth.usuarioLogueado && !this.procesandoPedido;
  }

  ngOnInit() {
    this.svc.getProductos().subscribe((data) => (this.productos = data));
    this.cartSvc.items$.subscribe((items) => (this.carritoItems = items));
    this.coberturaSvc.getZonasCobertura().subscribe({
      next: (zonas) => {
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
          'MENU_CART.ERROR_COVERAGE_UNAVAILABLE',
          undefined,
          'No se pudo cargar la cobertura en este momento.',
        );
      },
    });
    this.auth.usuario$.subscribe((user) => {
      if (user) {
        this.nombreUsuario = user.displayName ?? 'Cliente';
        this.emailUsuario = user.email ?? '';
        this.clienteSvc.getPerfil(user.uid).subscribe((perfil) => {
          this.clasificacionUsuario = perfil.clasificacion;
          this.pedidosCompletados = perfil.pedidosCompletados;
          this.montoTotalCompletado = perfil.montoTotalCompletado;
        });
        this.cargarHistorialPedidos(user.uid);
      }
    });
  }

  agregarAlCarrito(producto: Producto): void {
    this.cartSvc.addProducto(producto);
    this.mensajeCarrito = this.t(
      'MENU_CART.ADDED',
      { nombre: producto.nombre },
      `${producto.nombre} agregado al carrito`,
    );
    this.errorPedido = '';
    this.exitoPedido = '';
    this.mostrarCarrito = true;
  }

  toggleCarrito(): void {
    this.mostrarCarrito = !this.mostrarCarrito;
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

  toggleIngrediente(item: CarritoItem, ingrediente: string): void {
    this.cartSvc.toggleIngrediente(item.id, ingrediente);
  }

  ingredienteQuitado(item: CarritoItem, ingrediente: string): boolean {
    return (item.ingredientesQuitados ?? []).includes(ingrediente);
  }

  vaciarCarrito(): void {
    this.cartSvc.clear();
    this.mensajeCarrito = this.t('MENU_CART.CART_CLEARED', undefined, 'Carrito vaciado');
    this.exitoPedido = '';
    this.errorPedido = '';
    this.notaPedido = '';
  }

  irACheckout(): void {
    this.errorPedido = '';
    const usuario = this.auth.usuarioLogueado;

    if (!usuario) {
      this.errorPedido = this.t(
        'MENU_CART.ERROR_LOGIN_REQUIRED',
        undefined,
        'Debes iniciar sesion para realizar un pedido.',
      );
      return;
    }

    if (this.carritoItems.length === 0) {
      this.errorPedido = this.t(
        'MENU_CART.ERROR_EMPTY_CART',
        undefined,
        'Agrega productos antes de confirmar tu pedido.',
      );
      return;
    }

    this.mostrarCarrito = false;
    this.router.navigate(['/checkout']);
  }

  validarCoberturaDireccion(): void {
    const direccion = this.direccionEntrega.trim();

    if (!direccion || this.zonasCobertura.length === 0) {
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

  async finalizarPedido(): Promise<void> {
    const usuario = this.auth.usuarioLogueado;
    this.errorPedido = '';
    this.exitoPedido = '';

    if (!usuario) {
      this.errorPedido = this.t(
        'MENU_CART.ERROR_LOGIN_REQUIRED',
        undefined,
        'Debes iniciar sesion para realizar un pedido.',
      );
      return;
    }

    if (this.carritoItems.length === 0) {
      this.errorPedido = this.t(
        'MENU_CART.ERROR_EMPTY_CART',
        undefined,
        'Agrega productos antes de confirmar tu pedido.',
      );
      return;
    }

    if (!this.validarCoberturaAntesDeConfirmar()) {
      return;
    }

    const payload: CrearPedidoRequest = {
      clienteId: usuario.uid,
      clienteNombre: this.nombreUsuario || usuario.displayName || 'Cliente',
      clienteEmail: this.emailUsuario || usuario.email || '',
      direccionEntrega: this.direccionEntrega.trim(),
      referenciaEntrega: this.referenciaEntrega.trim(),
      zonaCobertura: this.zonaCoberturaDetectada,
      latEntrega: this.parseNumber(this.latEntrega),
      lngEntrega: this.parseNumber(this.lngEntrega),
      notaGeneral: this.notaPedido.trim(),
      total: this.totalCarrito,
      items: this.carritoItems.map((item) => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
        nota: item.ingredientesQuitados?.length
          ? `Sin: ${item.ingredientesQuitados.join(', ')}`
          : '',
        precio: item.precio,
      })),
    };

    this.procesandoPedido = true;

    try {
      const response = await this.pedidoSvc.createPedido(payload);
      this.cartSvc.clear();
      this.notaPedido = '';
      this.direccionEntrega = '';
      this.referenciaEntrega = '';
      this.latEntrega = '';
      this.lngEntrega = '';
      this.zonaCoberturaDetectada = '';
      this.coberturaValida = false;
      this.mensajeCarrito = '';
      this.exitoPedido = this.t(
        'MENU_CART.ORDER_CREATED',
        { numero: response.numero },
        `Pedido ${response.numero} creado correctamente.`,
      );
      this.mostrarModalExito = true;
      this.cargarHistorialPedidos(usuario.uid);
    } catch (error) {
      console.error('Error creando pedido:', error);
      this.errorPedido = this.resolverMensajeErrorPedido(error);
    } finally {
      this.procesandoPedido = false;
    }
  }

  private validarCoberturaAntesDeConfirmar(): boolean {
    this.validarCoberturaDireccion();

    if (!this.direccionEntrega.trim()) {
      this.errorPedido = this.t(
        'MENU_CART.ERROR_ADDRESS_REQUIRED',
        undefined,
        'Ingresa la direccion de entrega para continuar.',
      );
      return false;
    }

    if (this.errorCobertura) {
      this.errorPedido = this.errorCobertura;
      return false;
    }

    if (!this.coberturaValida) {
      this.errorPedido = this.t(
        'MENU_CART.ERROR_OUT_OF_COVERAGE',
        undefined,
        'La direccion ingresada no esta dentro de la zona de cobertura.',
      );
      return false;
    }

    return true;
  }

  private parseNumber(value: string): number | undefined {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private resolverMensajeErrorPedido(error: unknown): string {
    if (error instanceof TimeoutError) {
      return this.t(
        'MENU_CART.ERROR_CREATE_ORDER',
        undefined,
        'La creacion del pedido tardó demasiado. Verifica que el backend y Firebase esten disponibles e intenta nuevamente.',
      );
    }

    if (error instanceof HttpErrorResponse && error.status === 0) {
      return this.t(
        'MENU_CART.ERROR_CREATE_ORDER',
        undefined,
        'No se pudo conectar con el backend local. Verifica que la API en el puerto 3000 este activa.',
      );
    }

    return this.t(
      'MENU_CART.ERROR_CREATE_ORDER',
      undefined,
      'No se pudo crear el pedido. Verifica que el backend este activo.',
    );
  }

  cerrarModalExito(): void {
    this.mostrarModalExito = false;
  }

  cargarHistorialPedidos(clienteId: string): void {
    this.cargandoHistorial = true;
    this.errorHistorial = '';
    this.pedidoSvc.getPedidosPorCliente(clienteId).subscribe({
      next: (pedidos) => {
        this.historialPedidos = pedidos.slice(0, 5);
        this.cargandoHistorial = false;
      },
      error: () => {
        this.errorHistorial = this.t(
          'MENU_CART.ERROR_HISTORY',
          undefined,
          'No se pudo cargar tu historial de pedidos.',
        );
        this.cargandoHistorial = false;
      },
    });
  }

  private t(key: string, params?: Record<string, unknown>, fallback = ''): string {
    const translated = this.translate.instant(key, params);
    if (!translated || translated === key) {
      return fallback;
    }
    return translated;
  }

  irASeccion(id: string): void {
    const section = document.getElementById(id);
    if (!section) return;

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  cerrarSesion() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  getEmojiCategoria(categoria: string): string {
    const emojis: { [key: string]: string } = {
      hamburguesa: '🍔',
      hamburguesas: '🍔',
      pizza: '🍕',
      ensalada: '🥗',
      ensaladas: '🥗',
      bebida: '🥤',
      bebidas: '🥤',
      postre: '🍰',
      postres: '🍰',
      bowl: '🥙',
      bowls: '🥙',
      wrap: '🌯',
      wraps: '🌯',
      smoothie: '🥤',
      smoothies: '🥤',
      snack: '🍟',
      snacks: '🍟',
    };
    return emojis[categoria.toLowerCase()] ?? '🍽️';
  }

  getColorCategoria(categoria: string): string {
    const colores: { [key: string]: string } = {
      hamburguesa: '#fff3e0',
      hamburguesas: '#fff3e0',
      pizza: '#fce4ec',
      ensalada: '#e8f5e9',
      ensaladas: '#e8f5e9',
      bebida: '#e3f2fd',
      bebidas: '#e3f2fd',
      postre: '#f3e5f5',
      postres: '#f3e5f5',
      bowl: '#e1f5ee',
      bowls: '#e1f5ee',
      wrap: '#fff8e1',
      wraps: '#fff8e1',
      smoothie: '#fce4ec',
      smoothies: '#fce4ec',
      snack: '#fff3e0',
      snacks: '#fff3e0',
    };
    return colores[categoria.toLowerCase()] ?? '#f0f7f0';
  }
}
