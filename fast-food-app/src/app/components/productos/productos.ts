import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import { Categoria } from '../../models/categoria.model';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LangSwitchComponent } from '../lang-switch/lang-switch';
import { ClienteService } from '../../services/cliente.service';
import { ClienteRanking } from '../../models/cliente-ranking.model';
import { BolivianoCurrencyPipe } from '../../shared/pipes/boliviano-currency.pipe';
import { CoberturaService } from '../../services/cobertura.service';
import { CategoriaService } from '../../services/categoria.service';
import { ZonaCobertura } from '../../models/zona-cobertura.model';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import {
  esCategoriaProductoValida,
  normalizarCategoriaProducto,
  normalizarListaCategorias,
  PRODUCTO_CATEGORIAS_FALLBACK,
} from '../../shared/catalogs/producto-categorias';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LangSwitchComponent, BolivianoCurrencyPipe],
  templateUrl: './productos.html',
})
export class ProductosComponent implements OnInit {
  readonly svc = inject(ProductoService);
  readonly authSvc = inject(AuthService);
  readonly router = inject(Router);
  readonly translate = inject(TranslateService);
  readonly clienteSvc = inject(ClienteService);
  readonly coberturaSvc = inject(CoberturaService);
  readonly categoriaSvc = inject(CategoriaService);
  // Debajo de tus otros injects
  readonly sanitizer = inject(DomSanitizer);

  // ── Productos ──────────────────────────────────────────
  productos: Producto[] = [];
  editando: Producto | null = null;
  mostrarModal = false;
  errores: { [key: string]: string } = {};
  form: Producto = this.formVacio();
  ingredientesTexto = '';
  etiquetasTexto = '';

  // ── Categorías (colección Firestore) ───────────────────
  categorias: Categoria[] = [];
  categoriasDisponibles: string[] = [...PRODUCTO_CATEGORIAS_FALLBACK];
  mostrarModalCategoria = false;
  editandoCategoria: Categoria | null = null;
  formCategoria = this.formCategoriaVacio();
  erroresCategoria: { [key: string]: string } = {};

  // ── Otros ──────────────────────────────────────────────
  topClientes: ClienteRanking[] = [];
  zonas: ZonaCobertura[] = [];
  zonaEditando: ZonaCobertura | null = null;
  mostrarFormularioZona = false;
  errorZona = '';
  formZona = this.formZonaVacia();
  seccionActiva = 'admin-dashboard';

  readonly seccionesSidebar = [
    'admin-dashboard',
    'admin-platillos',
    'admin-categorias',
    'admin-cobertura',
    'admin-pedidos',
    'admin-usuarios',
    'admin-reportes',
  ];

  // ══════════════════════════════════════════════════════
  // Lifecycle
  // ══════════════════════════════════════════════════════
  ngOnInit() {
    this.cargarCategorias();
    this.cargarProductos();
    this.cargarRankingClientes();
    this.cargarZonas();
    this.actualizarSeccionActivaPorScroll();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.actualizarSeccionActivaPorScroll();
  }

  // ══════════════════════════════════════════════════════
  // Carga de datos
  // ══════════════════════════════════════════════════════
  cargarProductos() {
    this.svc.getProductos().subscribe((data) => {
      this.productos = data.map((p) => ({
        ...p,
        categoria: normalizarCategoriaProducto(p.categoria),
      }));
    });
  }

  cargarCategorias() {
    // Carga desde Firestore (con imagen)
    this.categoriaSvc.getCategorias().subscribe({
      next: (cats) => {
        this.categorias = cats;
        if (cats.length > 0) {
          this.categoriasDisponibles = cats.map((c) => c.nombre);
        }
      },
      error: () => {
        // Fallback al catálogo hardcodeado si Firestore falla
        this.svc.getCategorias().subscribe({
          next: (cats) => {
            const normalizadas = normalizarListaCategorias(cats);
            this.categoriasDisponibles = normalizadas.length
              ? normalizadas
              : [...PRODUCTO_CATEGORIAS_FALLBACK];
          },
          error: () => {
            this.categoriasDisponibles = [...PRODUCTO_CATEGORIAS_FALLBACK];
          },
        });
      },
    });
  }

  cargarRankingClientes() {
    this.clienteSvc.getRankingTop(10).subscribe((data) => (this.topClientes = data));
  }

  cargarZonas() {
    this.coberturaSvc.getZonasCobertura(true).subscribe((data) => (this.zonas = data));
  }

  // ══════════════════════════════════════════════════════
  // Formulario de producto (modal)
  // ══════════════════════════════════════════════════════
  formVacio(): Producto {
    return {
      nombre: '',
      descripcion: '',
      precio: 0,
      categoria: '',
      disponible: true,
      imagen: '',
      ingredientes: [],
      calorias: undefined,
      etiquetas: [],
    };
  }

  abrirModalNuevo() {
    this.editando = null;
    this.form = this.formVacio();
    this.ingredientesTexto = '';
    this.etiquetasTexto = '';
    this.errores = {};
    this.mostrarModal = true;
  }

  abrirModalEditar(p: Producto) {
    this.editando = p;
    this.form = { ...p, categoria: normalizarCategoriaProducto(p.categoria) };
    this.ingredientesTexto = (p.ingredientes ?? []).join(', ');
    this.etiquetasTexto = (p.etiquetas ?? []).join(', ');
    this.errores = {};
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.editando = null;
    this.form = this.formVacio();
    this.ingredientesTexto = '';
    this.etiquetasTexto = '';
    this.errores = {};
  }

  parsearLista(texto: string): string[] {
    if (!texto?.trim()) return [];
    return texto
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);
  }

  get ingredientesPreview(): string[] {
    return this.parsearLista(this.ingredientesTexto);
  }

  get etiquetasPreview(): string[] {
    return this.parsearLista(this.etiquetasTexto);
  }

  private normalizarFormulario(): void {
    this.form.nombre = (this.form.nombre ?? '').trim();
    this.form.categoria = normalizarCategoriaProducto(this.form.categoria);
    this.form.descripcion = (this.form.descripcion ?? '').trim();
    this.form.precio = Number(this.form.precio);
    this.form.imagen = (this.form.imagen ?? '').trim();
    this.form.ingredientes = this.parsearLista(this.ingredientesTexto);
    this.form.etiquetas = this.parsearLista(this.etiquetasTexto);
    if (this.form.calorias !== undefined && this.form.calorias !== null) {
      this.form.calorias = Number(this.form.calorias) || undefined;
    }
  }

  camposRequeridosValidos(): boolean {
    const nombreValido = !!this.form.nombre?.trim();
    const categoriaValida =
      this.categoriasDisponibles.includes(this.form.categoria) ||
      esCategoriaProductoValida(this.form.categoria, this.categoriasDisponibles);
    const precioValido = Number.isFinite(Number(this.form.precio)) && Number(this.form.precio) > 0;
    return nombreValido && categoriaValida && precioValido;
  }

  limpiarError(campo: string): void {
    delete this.errores[campo];
  }

  validar(): boolean {
    this.errores = {};
    this.normalizarFormulario();
    if (!this.form.nombre.trim())
      this.errores['nombre'] = this.translate.instant('ADMIN.ERROR_NOMBRE');
    if (!this.form.categoria.trim())
      this.errores['categoria'] = this.translate.instant('ADMIN.ERROR_CATEGORIA');
    if (!Number.isFinite(this.form.precio) || this.form.precio <= 0)
      this.errores['precio'] = this.translate.instant('ADMIN.ERROR_PRECIO');
    if (!this.form.descripcion.trim())
      this.errores['descripcion'] = this.translate.instant('ADMIN.ERROR_DESCRIPCION');
    return Object.keys(this.errores).length === 0;
  }

  async guardar() {
    if (!this.validar()) return;
    if (this.editando?.id) {
      await this.svc.updateProducto(this.editando.id, this.form, this.editando);
    } else {
      await this.svc.addProducto({ ...this.form });
    }
    this.cerrarModal();
    this.cargarProductos();
  }

  async eliminar(p: Producto) {
    if (confirm('¿Eliminar producto "' + p.nombre + '"?')) {
      await this.svc.deleteProducto(p.id!, p);
      this.cargarProductos();
    }
  }

  get productosDisponibles(): number {
    return this.productos.filter((p) => p.disponible).length;
  }

  productosDeCategoria(nombre: string): number {
    return this.productos.filter(
      (p) => normalizarCategoriaProducto(p.categoria) === normalizarCategoriaProducto(nombre),
    ).length;
  }

  imagenDeCategoria(nombre: string): string {
    return this.categorias.find((c) => c.nombre === nombre)?.imagen ?? '';
  }

  colorChipCategoria(index: number): { bg: string; color: string } {
    const paleta = [
      { bg: '#e1f5ee', color: '#0F6E56' },
      { bg: '#e6f1fb', color: '#075985' },
      { bg: '#faeeda', color: '#92400e' },
      { bg: '#fde8ff', color: '#701a75' },
      { bg: '#fff0e0', color: '#9a3412' },
      { bg: '#ecfdf5', color: '#065f46' },
      { bg: '#f0f9ff', color: '#0c4a6e' },
      { bg: '#fef3c7', color: '#78350f' },
      { bg: '#ede9fe', color: '#4c1d95' },
      { bg: '#fee2e2', color: '#7f1d1d' },
      { bg: '#d1fae5', color: '#064e3b' },
      { bg: '#dbeafe', color: '#1e3a5f' },
    ];
    return paleta[index % paleta.length];
  }

  // ══════════════════════════════════════════════════════
  // Formulario de categoría (modal)
  // ══════════════════════════════════════════════════════
  formCategoriaVacio() {
    return { nombre: '', imagen: '', activa: true };
  }

  abrirModalNuevaCategoria() {
    this.editandoCategoria = null;
    this.formCategoria = this.formCategoriaVacio();
    this.erroresCategoria = {};
    this.mostrarModalCategoria = true;
  }

  abrirModalEditarCategoria(cat: Categoria) {
    this.editandoCategoria = cat;
    this.formCategoria = {
      nombre: cat.nombre,
      imagen: cat.imagen ?? '',
      activa: cat.activa !== false,
    };
    this.erroresCategoria = {};
    this.mostrarModalCategoria = true;
  }

  cerrarModalCategoria() {
    this.mostrarModalCategoria = false;
    this.editandoCategoria = null;
    this.formCategoria = this.formCategoriaVacio();
    this.erroresCategoria = {};
  }

  async guardarCategoria() {
    this.erroresCategoria = {};
    const nombre = this.formCategoria.nombre.trim();
    if (!nombre) {
      this.erroresCategoria['nombre'] = 'El nombre es obligatorio';
      return;
    }
    const payload = {
      nombre,
      imagen: (this.formCategoria.imagen ?? '').trim(),
      activa: this.formCategoria.activa,
    };
    if (this.editandoCategoria?.id) {
      await this.categoriaSvc.updateCategoria(this.editandoCategoria.id, payload);
    } else {
      await this.categoriaSvc.addCategoria(payload);
    }
    this.cerrarModalCategoria();
  }

  async eliminarCategoria(cat: Categoria) {
    if (confirm('¿Eliminar categoría "' + cat.nombre + '"?')) {
      await this.categoriaSvc.deleteCategoria(cat.id!);
    }
  }

  async toggleActivaCategoria(cat: Categoria) {
    if (!cat.id) return;
    await this.categoriaSvc.updateCategoria(cat.id, { activa: !cat.activa });
  }

  // ══════════════════════════════════════════════════════
  // Zonas de cobertura
  // ══════════════════════════════════════════════════════
  formZonaVacia() {
    return { nombre: '', referencias: '', activa: true };
  }

  async guardarZona() {
    const nombre = this.formZona.nombre.trim();
    if (!nombre) {
      this.errorZona = this.translate.instant('ADMIN.COBERTURA.ERROR_NOMBRE');
      return;
    }
    const referencias = this.formZona.referencias
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);
    const payload = { nombre, referencias, activa: this.formZona.activa };
    if (this.zonaEditando?.id) {
      await this.coberturaSvc.updateZona(this.zonaEditando.id, payload);
    } else {
      await this.coberturaSvc.addZona(payload);
    }
    this.cancelarZona();
    this.mostrarFormularioZona = false;
  }

  editarZona(zona: ZonaCobertura) {
    this.zonaEditando = zona;
    this.formZona = {
      nombre: zona.nombre,
      referencias: (zona.referencias ?? []).join(', '),
      activa: zona.activa !== false,
    };
    this.errorZona = '';
    this.mostrarFormularioZona = true;
  }

  async cambiarEstadoZona(zona: ZonaCobertura, activa: boolean) {
    if (!zona.id) return;
    await this.coberturaSvc.updateZona(zona.id, { activa });
  }

  cancelarZona() {
    this.zonaEditando = null;
    this.formZona = this.formZonaVacia();
    this.errorZona = '';
  }

  toggleFormularioZona() {
    this.mostrarFormularioZona = !this.mostrarFormularioZona;
    if (!this.mostrarFormularioZona) this.cancelarZona();
  }

  // ══════════════════════════════════════════════════════
  // Navegación sidebar
  // ══════════════════════════════════════════════════════
  async logout() {
    await this.authSvc.logout();
    this.router.navigate(['/login']);
  }

  irASeccion(id: string): void {
    this.seccionActiva = id;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  estiloItemSidebar(id: string): string {
    const activo = this.seccionActiva === id;
    return activo
      ? 'background:#f0f7f0;border-radius:8px;padding:8px 12px;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500;color:#1D9E75;cursor:pointer'
      : 'padding:8px 12px;display:flex;align-items:center;gap:8px;font-size:13px;color:#555;cursor:pointer;border-radius:8px';
  }

  private actualizarSeccionActivaPorScroll(): void {
    let candidata: { id: string; distancia: number } | null = null;
    for (const id of this.seccionesSidebar) {
      const top = document.getElementById(id)?.getBoundingClientRect().top;
      if (top !== undefined && top <= 140) {
        const distancia = Math.abs(top);
        if (!candidata || distancia < candidata.distancia) candidata = { id, distancia };
      }
    }
    if (candidata) this.seccionActiva = candidata.id;
  }
  hoverBtn(el: EventTarget | null, activo: boolean) {
    const btn = el as HTMLElement;
    btn.style.borderColor = activo ? '#1D9E75' : '#ddd';
    btn.style.color = activo ? '#1D9E75' : '#bbb';
  }
  getSafeUrl(url: string): SafeUrl {
    if (!url) return '';
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }
}
