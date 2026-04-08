import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.html',
})


export class ProductosComponent implements OnInit {
  readonly svc = inject(ProductoService);

  productos: Producto[] = [];
  editando: Producto | null = null;

  form: Producto = this.formVacio();

cargarProductos() {
  this.svc.getProductos().subscribe(data => this.productos = data);
}

async guardar() {
  if (this.editando?.id) {
    await this.svc.updateProducto(this.editando.id, this.form, this.editando);
  } else {
    await this.svc.addProducto({ ...this.form });
  }
  this.cancelar();
  this.mostrarFormulario = false;
  this.cargarProductos();
}

  ngOnInit() {
  this.cargarProductos();
}

  formVacio(): Producto {
    return { nombre: '', descripcion: '', precio: 0, categoria: '', disponible: true };
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
  readonly authSvc = inject(AuthService);
readonly router = inject(Router);
// Agregar junto a las otras propiedades
mostrarFormulario = false;

// Reemplaza el pipe 'array' — calcula disponibles aquí directamente
get productosDisponibles(): number {
  return this.productos.filter(p => p.disponible).length;
}

// Reemplaza la lógica inline del botón que usaba 'if' en el template
toggleFormulario() {
  this.mostrarFormulario = !this.mostrarFormulario;
  if (!this.mostrarFormulario) this.cancelar();
}
}

