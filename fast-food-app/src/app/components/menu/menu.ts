import { ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
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
import { FavoritosService, FavoritoItem } from '../../services/favoritos';
import { CrearPedidoRequest, PedidoHistorialItem } from '../../models/pedido.model';
import { TimeoutError, Subscription } from 'rxjs';
import { CoberturaService } from '../../services/cobertura.service';
import { ZonaCobertura } from '../../models/zona-cobertura.model';
import { BolivianoCurrencyPipe } from '../../shared/pipes/boliviano-currency.pipe';
import { normalizarCategoriaProducto } from '../../shared/catalogs/producto-categorias';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseApp } from '../../services/firebase-app';

interface PedidoActivoTracked {
  id: string;
  numero: string;
  estado: string;
  unsubscribe: () => void;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LangSwitchComponent, BolivianoCurrencyPipe],
  templateUrl: './menu.html',
})
export class MenuComponent implements OnInit, OnDestroy {
  private svc = inject(ProductoService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private clienteSvc = inject(ClienteService);
  private cartSvc = inject(CartService);
  private pedidoSvc = inject(PedidoService);
  private favSvc = inject(FavoritosService);
  private coberturaSvc = inject(CoberturaService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);

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
  mostrarMisPedidos = false;
  mostrarFavoritos = false;
  favoritosIds: Set<string> = new Set();
  favoritosItems: FavoritoItem[] = [];

  // ─── Multi-pedido activo ────────────────────────────────────────────────────
  pedidosActivos: PedidoActivoTracked[] = [];
  ultimoPedidoActivoId: string | null = null;
  ultimoPedidoActivoNumero: string | null = null;
  // ───────────────────────────────────────────────────────────────────────────

  private subs: Subscription[] = [];

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

  /** Pedidos activos (no entregados ni cancelados) */
  get pedidosActivosVisibles(): PedidoActivoTracked[] {
    return this.pedidosActivos.filter((p) => !this.esEntregado(p.estado));
  }

  /** Si hay al menos un pedido en curso */
  get hayPedidoActivo(): boolean {
    return this.pedidosActivosVisibles.length > 0;
  }

  esEntregado(estado: string): boolean {
    return estado === 'entregado';
  }

  ngOnInit() {
    this.categoriaActiva = 'Todas';

    this.subs.push(
      this.svc.getProductos().subscribe((data) => {
        this.productos = data.map((producto) => ({
          ...producto,
          categoria: normalizarCategoriaProducto(producto.categoria),
        }));
        this.categoriaActiva = 'Todas';
        this.cdr.detectChanges();
      }),
    );

    this.subs.push(
      this.cartSvc.items$.subscribe((items) => {
        this.carritoItems = items;
        this.cdr.detectChanges();
      }),
    );

    this.subs.push(
      this.coberturaSvc.getZonasCobertura().subscribe({
        next: (zonas) => {
          this.zonasCobertura = zonas;
          this.errorCobertura = '';
          this.validarCoberturaDireccion();
          this.cdr.detectChanges();
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
          this.cdr.detectChanges();
        },
      }),
    );

    this.subs.push(
      this.auth.usuario$.subscribe((user) => {
        if (user) {
          this.nombreUsuario = user.displayName ?? 'Cliente';
          this.emailUsuario = user.email ?? '';

          this.clienteSvc.getPerfil(user.uid).subscribe((perfil) => {
            this.clasificacionUsuario = perfil.clasificacion;
            this.pedidosCompletados = perfil.pedidosCompletados;
            this.montoTotalCompletado = perfil.montoTotalCompletado;
            this.cdr.detectChanges();
          });

          this.cargarHistorialPedidos(user.uid);
          this.restaurarPedidosActivos(user.uid);
          // Iniciar listener de favoritos
          this.favSvc.iniciarListener(user.uid);
          this.subs.push(
            this.favSvc.favIds$.subscribe((ids) => {
              this.favoritosIds = ids;
              this.cdr.detectChanges();
            }),
            this.favSvc.favItems$.subscribe((items) => {
              this.favoritosItems = items;
              this.cdr.detectChanges();
            }),
          );
        }
        this.cdr.detectChanges();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.pedidosActivos.forEach((p) => p.unsubscribe());
    this.favSvc.detenerListener();
  }

  // ─── Restaurar y escuchar pedidos activos guardados en localStorage ─────────
  private restaurarPedidosActivos(uid: string): void {
    const raw = localStorage.getItem(`pedidos_activos_${uid}`);
    if (!raw) return;

    let guardados: { id: string; numero: string }[] = [];
    try {
      guardados = JSON.parse(raw);
    } catch {
      return;
    }

    for (const g of guardados) {
      this.iniciarListenerPedido(uid, g.id, g.numero);
    }
  }

  private persistirPedidosActivos(uid: string): void {
    const data = this.pedidosActivos.map((p) => ({ id: p.id, numero: p.numero }));
    localStorage.setItem(`pedidos_activos_${uid}`, JSON.stringify(data));
    // Mantener compat. con clave legacy del último pedido
    if (this.pedidosActivos.length > 0) {
      const ultimo = this.pedidosActivos[this.pedidosActivos.length - 1];
      this.ultimoPedidoActivoId = ultimo.id;
      this.ultimoPedidoActivoNumero = ultimo.numero;
    }
  }

  private iniciarListenerPedido(uid: string, pedidoId: string, numero: string): void {
    // Evitar duplicados
    if (this.pedidosActivos.find((p) => p.id === pedidoId)) return;

    const tracked: PedidoActivoTracked = {
      id: pedidoId,
      numero,
      estado: 'pendiente',
      unsubscribe: () => {},
    };
    this.pedidosActivos.push(tracked);

    const db = getFirestore(getFirebaseApp());
    const ref = doc(db, 'pedidos', pedidoId);

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        this.removerPedidoActivo(uid, pedidoId);
        return;
      }
      const data = snap.data() as { estado?: string };
      tracked.estado = data['estado'] ?? 'pendiente';

      // Si ya fue entregado, limpiarlo tras 30 s para que el usuario vea el estado final
      if (tracked.estado === 'entregado') {
        setTimeout(() => {
          this.removerPedidoActivo(uid, pedidoId);
        }, 30_000);
      }

      this.cdr.detectChanges();
    });

    tracked.unsubscribe = unsub;
  }

  private removerPedidoActivo(uid: string, pedidoId: string): void {
    const idx = this.pedidosActivos.findIndex((p) => p.id === pedidoId);
    if (idx !== -1) {
      this.pedidosActivos[idx].unsubscribe();
      this.pedidosActivos.splice(idx, 1);
    }
    this.persistirPedidosActivos(uid);
    this.cdr.detectChanges();
  }
  // ───────────────────────────────────────────────────────────────────────────

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

      // Registrar nuevo pedido activo y lanzar listener en tiempo real
      this.iniciarListenerPedido(usuario.uid, response.id, response.numero);
      this.persistirPedidosActivos(usuario.uid);
      this.ultimoPedidoActivoId = response.id;
      this.ultimoPedidoActivoNumero = response.numero;

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

  irASeguimientoDesdeModal(): void {
    this.mostrarModalExito = false;
    if (this.ultimoPedidoActivoId) {
      this.router.navigate(['/seguimiento', this.ultimoPedidoActivoId]);
    }
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

  esFavorito(productoId: string | undefined): boolean {
    return this.favoritosIds.has(productoId ?? '');
  }

  async toggleFavorito(p: {
    id?: string;
    nombre: string;
    descripcion: string;
    precio: number;
    categoria: string;
  }): Promise<void> {
    const usuario = this.auth.usuarioLogueado;
    if (!usuario) return;
    await this.favSvc.toggleFavorito(usuario.uid, p);
  }

  toggleFavoritos(): void {
    this.mostrarFavoritos = !this.mostrarFavoritos;
    this.mostrarDropdown = false;
  }

  agregarFavoritoAlCarrito(fav: {
    productoId: string;
    nombre: string;
    descripcion: string;
    precio: number;
    categoria: string;
  }): void {
    // Construir un Producto mínimo compatible con CartService
    const prod = {
      id: fav.productoId,
      nombre: fav.nombre,
      descripcion: fav.descripcion,
      precio: fav.precio,
      categoria: fav.categoria,
      disponible: true,
      ingredientes: [] as string[],
    };
    this.cartSvc.addProducto(prod as any);
    this.mensajeCarrito = `${fav.nombre} agregado al carrito`;
    this.mostrarFavoritos = false;
    this.mostrarCarrito = true;
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
    const categoriaNormalizada = normalizarCategoriaProducto(categoria).toLowerCase();
    const emojis: { [key: string]: string } = {
      hamburguesas: '🍔',
      pizza: '🍕',
      ensalada: '🥗',
      bebidas: '🥤',
      postres: '🍰',
      bowls: '🥙',
      wraps: '🌯',
      smoothies: '🥤',
      snacks: '🍟',
      'plato fuerte': '🍛',
      sopas: '🍲',
      'version vegetariana': '🥬',
    };
    return emojis[categoriaNormalizada] ?? '🍽️';
  }

  getColorCategoria(categoria: string): string {
    const categoriaNormalizada = normalizarCategoriaProducto(categoria).toLowerCase();
    const colores: { [key: string]: string } = {
      hamburguesas: '#fff3e0',
      pizza: '#fce4ec',
      ensalada: '#e8f5e9',
      bebidas: '#e3f2fd',
      postres: '#f3e5f5',
      bowls: '#e1f5ee',
      wraps: '#fff8e1',
      smoothies: '#fce4ec',
      snacks: '#fff3e0',
      'plato fuerte': '#fff4e5',
      sopas: '#fff8e1',
      'version vegetariana': '#f0fdf4',
    };
    return colores[categoriaNormalizada] ?? '#f0f7f0';
  }

  irASeguimiento(id: string): void {
    this.mostrarMisPedidos = false;
    this.mostrarDropdown = false;
    this.router.navigate(['/seguimiento', id]);
  }

  toggleMisPedidos(): void {
    this.mostrarMisPedidos = !this.mostrarMisPedidos;
    this.mostrarDropdown = false;
    if (this.mostrarMisPedidos) {
      const user = this.auth.usuarioLogueado;
      if (user) this.cargarHistorialPedidos(user.uid);
    }
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      pendiente_pago: 'Pendiente de pago',
      pendiente: 'Recibido',
      preparando: 'En preparación',
      listo: 'Listo',
      en_camino: 'En camino',
      recogido: 'Recogido',
      entregado: 'Entregado ✓',
    };
    return labels[estado] ?? estado;
  }

  getEstadoColor(estado: string): string {
    const colors: Record<string, string> = {
      pendiente_pago: '#f59e0b',
      pendiente: '#3b82f6',
      preparando: '#8b5cf6',
      listo: '#1D9E75',
      en_camino: '#f97316',
      recogido: '#f97316',
      entregado: '#6b7280',
    };
    return colors[estado] ?? '#888';
  }

  getEstadoBg(estado: string): string {
    const bgs: Record<string, string> = {
      pendiente_pago: '#fffbeb',
      pendiente: '#eff6ff',
      preparando: '#f5f3ff',
      listo: '#f0faf5',
      en_camino: '#fff7ed',
      recogido: '#fff7ed',
      entregado: '#f9fafb',
    };
    return bgs[estado] ?? '#f8f8f8';
  }
}
