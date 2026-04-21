import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { vi } from 'vitest';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { CheckoutComponent } from './checkout';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { PedidoService } from '../../services/pedido.service';

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;

  let cartServiceSpy: {
    items$: Observable<unknown[]>;
    incrementar: ReturnType<typeof vi.fn>;
    decrementar: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };

  let authServiceMock: {
    usuario$: Observable<unknown>;
    usuarioLogueado: { uid: string; displayName: string; email: string } | null;
  };

  let pedidoServiceSpy: {
    createPedido: ReturnType<typeof vi.fn>;
  };

  const routerSpy = {
    navigate: vi.fn().mockResolvedValue(true)
  };

  const translateServiceSpy = {
    instant: vi.fn((key: string) => key)
  };

  beforeEach(async () => {
    cartServiceSpy = {
      items$: of([]),
      incrementar: vi.fn(),
      decrementar: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn()
    };

    authServiceMock = {
      usuario$: of({ uid: 'u1', displayName: 'Ana', email: 'ana@test.com' }),
      usuarioLogueado: { uid: 'u1', displayName: 'Ana', email: 'ana@test.com' }
    };

    pedidoServiceSpy = {
      createPedido: vi.fn().mockResolvedValue({ id: 'p1', numero: 'VS-100', estado: 'pendiente', hora: '11:00', total: 59 })
    };

    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        { provide: CartService, useValue: cartServiceSpy },
        { provide: AuthService, useValue: authServiceMock },
        { provide: PedidoService, useValue: pedidoServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: TranslateService, useValue: translateServiceSpy }
      ]
    }).overrideComponent(CheckoutComponent, {
      set: { template: '' }
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('no avanza a confirmacion si el carrito esta vacio', () => {
    component.continuarAConfirmacion();

    expect(component.paso).toBe('resumen');
    expect(component.errorCheckout).toContain('Agrega productos en tu carrito para continuar.');
  });

  it('confirma pedido y muestra paso de resultado', async () => {
    component.carritoItems = [{
      id: '1',
      nombre: 'Ensalada',
      descripcion: 'fresca',
      precio: 59,
      categoria: 'Ensalada',
      cantidad: 1
    }];
    component.notaPedido = 'sin cebolla';
    component.paso = 'confirmacion';

    await component.confirmarPedido();

    expect(pedidoServiceSpy.createPedido).toHaveBeenCalled();
    expect(cartServiceSpy.clear).toHaveBeenCalled();
    expect(component.paso).toBe('resultado');
    expect(component.pedidoCreado?.numero).toBe('VS-100');
  });
});

