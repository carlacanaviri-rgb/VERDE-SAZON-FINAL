import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.html',
})
export class MenuComponent implements OnInit {
  private svc = inject(ProductoService);
  private router = inject(Router);

  productos: Producto[] = [];
  categoriaActiva = 'Todas';

  get categorias(): string[] {
    const cats = this.productos.map(p => p.categoria);
    return ['Todas', ...new Set(cats)];
  }

  get productosFiltrados(): Producto[] {
    const disponibles = this.productos.filter(p => p.disponible);
    if (this.categoriaActiva === 'Todas') return disponibles;
    return disponibles.filter(p => p.categoria === this.categoriaActiva);
  }

  ngOnInit() {
    this.svc.getProductos().subscribe(data => this.productos = data);
  }

  irLogin() {
    this.router.navigate(['/login']);
  }

  getEmojiCategoria(categoria: string): string {
    const emojis: { [key: string]: string } = {
      hamburguesa: '🍔', hamburguesas: '🍔',
      pizza: '🍕',
      ensalada: '🥗', ensaladas: '🥗',
      bebida: '🥤', bebidas: '🥤',
      postre: '🍰', postres: '🍰',
      bowl: '🥙', bowls: '🥙',
      wrap: '🌯', wraps: '🌯',
      smoothie: '🥤', smoothies: '🥤',
      snack: '🍟', snacks: '🍟',
    };
    return emojis[categoria.toLowerCase()] ?? '🍽️';
  }

}