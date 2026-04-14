import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LangSwitchComponent } from '../lang-switch/lang-switch';


@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LangSwitchComponent],
  templateUrl: './productos.html',
})


export class ProductosComponent implements OnInit {
  readonly svc = inject(ProductoService);
  readonly authSvc = inject(AuthService);
  readonly router = inject(Router);
  readonly translate = inject(TranslateService);

  productos: Producto[] = [];
  editando: Producto | null = null;
  mostrarFormulario = false;
  errores: { [key: string]: string } = {};
  form: Producto = this.formVacio();

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    this.svc.getProductos().subscribe(data => this.productos = data);
  }

  formVacio(): Producto {
    return { nombre: '', descripcion: '', precio: 0, categoria: '', disponible: true };
  }


  validar(): boolean {
    this.errores = {};
    if (!this.form.nombre.trim())
      this.errores['nombre'] = 'El nombre es obligatorio';
    if (!this.form.categoria.trim())
      this.errores['categoria'] = 'La categoría es obligatoria';
    if (this.form.precio <= 0)
      this.errores['precio'] = 'El precio debe ser mayor a 0';
    if (!this.form.descripcion.trim())
      this.errores['descripcion'] = 'La descripción es obligatoria';
    return Object.keys(this.errores).length === 0;
  }

  async guardar() {
    if (!this.validar()) return;  // ← agrega esta línea
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


}
