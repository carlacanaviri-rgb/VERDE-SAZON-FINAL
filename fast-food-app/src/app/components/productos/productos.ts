import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LangSwitchComponent } from '../lang-switch/lang-switch';
import { ClienteService } from '../../services/cliente.service';
import { ClienteRanking } from '../../models/cliente-ranking.model';
import { BolivianoCurrencyPipe } from '../../shared/pipes/boliviano-currency.pipe';
import { CoberturaService } from '../../services/cobertura.service';
import { ZonaCobertura } from '../../models/zona-cobertura.model';


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

  productos: Producto[] = [];
  editando: Producto | null = null;
  mostrarFormulario = false;
  errores: { [key: string]: string } = {};
  form: Producto = this.formVacio();
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
    'admin-reportes'
  ];

  ngOnInit() {
    this.cargarProductos();
    this.cargarRankingClientes();
    this.cargarZonas();
    this.actualizarSeccionActivaPorScroll();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.actualizarSeccionActivaPorScroll();
  }

  cargarProductos() {
    this.svc.getProductos().subscribe(data => this.productos = data);
  }

  cargarRankingClientes() {
    this.clienteSvc.getRankingTop(10).subscribe(data => this.topClientes = data);
  }

  cargarZonas() {
    this.coberturaSvc.getZonasCobertura(true).subscribe(data => this.zonas = data);
  }

  formVacio(): Producto {
    return { nombre: '', descripcion: '', precio: 0, categoria: '', disponible: true };
  }

  formZonaVacia() {
    return { nombre: '', referencias: '', activa: true };
  }

  private normalizarFormulario(): void {
    this.form.nombre = (this.form.nombre ?? '').trim();
    this.form.categoria = (this.form.categoria ?? '').trim();
    this.form.descripcion = (this.form.descripcion ?? '').trim();
    this.form.precio = Number(this.form.precio);
  }

  camposRequeridosValidos(): boolean {
    const nombreValido = !!this.form.nombre?.trim();
    const categoriaValida = !!this.form.categoria?.trim();
    const precioNumerico = Number(this.form.precio);
    const precioValido = Number.isFinite(precioNumerico) && precioNumerico > 0;

    return nombreValido && categoriaValida && precioValido;
  }

  limpiarError(campo: string): void {
    if (this.errores[campo]) {
      delete this.errores[campo];
    }
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
    this.cancelar();
    this.mostrarFormulario = false;
    this.cargarProductos();
  }

  editar(p: Producto) {
    this.editando = p;
    this.form = { ...p };
    this.errores = {};
  }

  async eliminar(p: Producto) {
    if (confirm('¿Eliminar producto?')) {
      await this.svc.deleteProducto(p.id!, p);
      this.cargarProductos();
    }
  }

  cancelar() {
    this.editando = null;
    this.form = this.formVacio();
    this.errores = {};
  }

  async logout() {
    await this.authSvc.logout();
    this.router.navigate(['/login']);
  }

  get productosDisponibles(): number {
    return this.productos.filter(p => p.disponible).length;
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.cancelar();
    }
  }

  async guardarZona() {
    const nombre = this.formZona.nombre.trim();
    if (!nombre) {
      this.errorZona = this.translate.instant('ADMIN.COBERTURA.ERROR_NOMBRE');
      return;
    }

    const referencias = this.formZona.referencias
      .split(',')
      .map(ref => ref.trim())
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
      activa: zona.activa !== false
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
    if (!this.mostrarFormularioZona) {
      this.cancelarZona();
    }
  }

  irASeccion(id: string): void {
    this.seccionActiva = id;
    const section = document.getElementById(id);
    if (!section) return;

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      const section = document.getElementById(id);
      if (!section) continue;

      const top = section.getBoundingClientRect().top;
      if (top <= 140) {
        const distancia = Math.abs(top);
        if (!candidata || distancia < candidata.distancia) {
          candidata = { id, distancia };
        }
      }
    }

    if (candidata) {
      this.seccionActiva = candidata.id;
    }
  }


}
