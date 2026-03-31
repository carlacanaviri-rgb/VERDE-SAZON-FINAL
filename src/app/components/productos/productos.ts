import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CoberturaService } from '../../services/cobertura.service';
import { ZonaCobertura } from '../../models/zona-cobertura.model';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.html',
})


export class ProductosComponent implements OnInit {
  readonly svc = inject(ProductoService);
  private coberturaSvc = inject(CoberturaService);
  private authSvc = inject(AuthService);
  private router = inject(Router);

  productos: Producto[] = [];
  editando: Producto | null = null;
  mostrarFormulario = false;

  form: Producto = this.formVacio();

  zonasCobertura: ZonaCobertura[] = [];
  zonaNombre = '';
  zonaReferencias = '';

  ngOnInit() {
    this.svc.getProductos().subscribe(data => this.productos = data);
    this.coberturaSvc.getZonasCobertura().subscribe(data => this.zonasCobertura = data);
  }

  formVacio(): Producto {
    return { nombre: '', descripcion: '', precio: 0, categoria: '', disponible: true };
  }

  async guardar() {
    if (this.editando?.id) {
      await this.svc.updateProducto(this.editando.id, this.form, this.editando);
    } else {
      await this.svc.addProducto({ ...this.form });
    }
    this.cancelar();
  }

  editar(p: Producto) {
    this.editando = p;
    this.form = { ...p };
  }

  async eliminar(p: Producto) {
    if (confirm('¿Eliminar producto?')) {
      await this.svc.deleteProducto(p.id!, p);
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

  async guardarZona() {
    const nombre = this.zonaNombre.trim();
    const refs = this.zonaReferencias
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    if (!nombre) {
      return;
    }

    await this.coberturaSvc.addZona({
      nombre,
      referencias: refs,
      activa: true,
    });

    this.zonaNombre = '';
    this.zonaReferencias = '';
  }

  async eliminarZona(zona: ZonaCobertura) {
    if (!zona.id) {
      return;
    }

    if (confirm(`¿Eliminar zona de cobertura ${zona.nombre}?`)) {
      await this.coberturaSvc.deleteZona(zona.id);
    }
  }

get productosDisponibles(): number {
  return this.productos.filter(p => p.disponible).length;
}

toggleFormulario() {
  this.mostrarFormulario = !this.mostrarFormulario;
  if (!this.mostrarFormulario) this.cancelar();
}
}

