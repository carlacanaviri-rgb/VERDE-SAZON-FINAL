import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { MenuComponent } from './menu';
import { ProductoService } from '../../services/producto.service';
import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
import { CartService } from '../../services/cart.service';
import { PedidoService } from '../../services/pedido.service';

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;
  let authServiceMock: {
    usuario$: Observable<unknown>;
    usuarioLogueado: { uid: string; displayName: string; email: string } | null;
    logout: ReturnType<typeof vi.fn>;
  };
  let cartServiceSpy: {
    items$: Observable<unknown[]>;
    addProducto: ReturnType<typeof vi.fn>;
    incrementar: ReturnType<typeof vi.fn>;
    decrementar: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };
  let pedidoServiceSpy: {
    createPedido: ReturnType<typeof vi.fn>;
    getPedidosPorCliente: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authServiceMock = {
      usuario$: of(null),
      usuarioLogueado: null,
      logout: vi.fn().mockResolvedValue(undefined)
    };

    cartServiceSpy = {
      items$: of([]),
      addProducto: vi.fn(),
      incrementar: vi.fn(),
      decrementar: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn()
    };

    pedidoServiceSpy = {
      createPedido: vi.fn().mockResolvedValue({ id: 'p1', numero: 'VS-1', estado: 'pendiente', hora: '10:00', total: 59 }),
      getPedidosPorCliente: vi.fn().mockReturnValue(of([]))
    };

    await TestBed.configureTestingModule({
      imports: [MenuComponent],
      providers: [
        { provide: ProductoService, useValue: { getProductos: () => of([]) } },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ClienteService, useValue: { getPerfil: () => of({ clienteId: 'x', clasificacion: 'Nuevo', pedidosCompletados: 0, montoTotalCompletado: 0 }) } },
        { provide: CartService, useValue: cartServiceSpy },
        { provide: PedidoService, useValue: pedidoServiceSpy },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
      ],
    })
      .overrideComponent(MenuComponent, {
        set: { template: '' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('agrega productos al carrito y muestra el panel', () => {
    const producto = {
      id: '1',
      nombre: 'Ensalada de pollo',
      descripcion: 'muy saludable',
      precio: 59,
      categoria: 'Ensalada',
      disponible: true
    };

    component.agregarAlCarrito(producto);

    expect(cartServiceSpy.addProducto).toHaveBeenCalledWith(producto);
    expect(component.mostrarCarrito).toBe(true);
    expect(component.mensajeCarrito).toContain('Ensalada de pollo');
  });

  it('crea un pedido real desde el carrito', async () => {
    authServiceMock.usuarioLogueado = {
      uid: 'user-1',
      displayName: 'Ana',
      email: 'ana@test.com'
    };
    component.nombreUsuario = 'Ana';
    component.emailUsuario = 'ana@test.com';
    component.carritoItems = [{
      id: '1',
      nombre: 'Ensalada de pollo',
      descripcion: 'muy saludable',
      precio: 59,
      categoria: 'Ensalada',
      cantidad: 2
    }];
    component.notaPedido = 'Sin cebolla';

    await component.finalizarPedido();

    expect(pedidoServiceSpy.createPedido).toHaveBeenCalledWith(expect.objectContaining({
      clienteId: 'user-1',
      clienteNombre: 'Ana',
      clienteEmail: 'ana@test.com',
      notaGeneral: 'Sin cebolla',
      total: 118
    }));
    expect(cartServiceSpy.clear).toHaveBeenCalled();
    expect(component.exitoPedido).toContain('VS-1');
    expect(component.mostrarModalExito).toBe(true);
    expect(pedidoServiceSpy.getPedidosPorCliente).toHaveBeenCalledWith('user-1');
  });
});
