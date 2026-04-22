import { ComponentFixture, TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Observable, of } from 'rxjs';
import { vi } from 'vitest';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { CheckoutComponent } from './checkout';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { PedidoService } from '../../services/pedido.service';
import { CoberturaService } from '../../services/cobertura.service';

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
    confirmarPersistenciaFirestore: ReturnType<typeof vi.fn>;
    confirmarPago: ReturnType<typeof vi.fn>;
    escucharPedido: ReturnType<typeof vi.fn>;
  };

  let coberturaServiceSpy: {
    getZonasCobertura: ReturnType<typeof vi.fn>;
    validarDireccion: ReturnType<typeof vi.fn>;
    sugerirZonasCercanas: ReturnType<typeof vi.fn>;
  };

  const routerSpy = {
    navigate: vi.fn().mockResolvedValue(true),
    url: '/checkout'
  };

  const translateServiceSpy = {
    instant: vi.fn((key: string) => key)
  };

  beforeEach(async () => {
    sessionStorage.clear();
    routerSpy.navigate.mockClear();
    routerSpy.url = '/checkout';

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
      createPedido: vi.fn().mockResolvedValue({ id: 'p1', numero: 'VS-100', estado: 'pendiente_pago', hora: '11:00', total: 59 }),
      confirmarPersistenciaFirestore: vi.fn().mockResolvedValue(undefined),
      confirmarPago: vi.fn().mockResolvedValue(undefined),
      escucharPedido: vi.fn().mockReturnValue(of({ estado: 'pendiente', pagoEstado: 'pagado' }))
    };

    coberturaServiceSpy = {
      getZonasCobertura: vi.fn().mockReturnValue(of([{ id: 'z1', nombre: 'Centro', referencias: ['calle 10'], activa: true }])),
      validarDireccion: vi.fn().mockReturnValue({ enCobertura: true, zona: 'Centro' }),
      sugerirZonasCercanas: vi.fn().mockReturnValue([])
    };

    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        { provide: CartService, useValue: cartServiceSpy },
        { provide: AuthService, useValue: authServiceMock },
        { provide: PedidoService, useValue: pedidoServiceSpy },
        { provide: CoberturaService, useValue: coberturaServiceSpy },
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

  it('confirma pedido y navega a la vista qr', async () => {
    component.carritoItems = [{
      id: '1',
      nombre: 'Ensalada',
      descripcion: 'fresca',
      precio: 59,
      categoria: 'Ensalada',
      cantidad: 1
    }];
    component.notaPedido = 'sin cebolla';
    component.direccionEntrega = 'Calle 10 #20-30';
    component.referenciaEntrega = 'Porton verde';
    component.paso = 'confirmacion';

    await component.confirmarPedido();

    expect(pedidoServiceSpy.createPedido).toHaveBeenCalledWith(expect.objectContaining({
      direccionEntrega: 'Calle 10 #20-30',
      referenciaEntrega: 'Porton verde',
      zonaCobertura: 'Centro'
    }));
    expect(pedidoServiceSpy.confirmarPersistenciaFirestore).toHaveBeenCalledWith('p1');
    expect(cartServiceSpy.clear).toHaveBeenCalled();
    expect(component.paso).toBe('resultado');
    expect(component.pedidoCreado?.numero).toBe('VS-100');
    expect(component.pagoConfirmado).toBe(true);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/checkout/qr']);
    expect(sessionStorage.getItem('verde-sazon-checkout-qr')).toContain('VS-100');
  });

  it('restaura la sesion QR cuando entra directo a /checkout/qr', async () => {
    fixture.destroy();
    routerSpy.url = '/checkout/qr';
    pedidoServiceSpy.escucharPedido.mockClear();
    sessionStorage.setItem('verde-sazon-checkout-qr', JSON.stringify({
      pedidoCreado: { id: 'p1', numero: 'VS-100', estado: 'pendiente_pago', hora: '11:00', total: 59 },
      nombreUsuario: 'Ana',
      emailUsuario: 'ana@test.com'
    }));

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.paso).toBe('resultado');
    expect(component.pedidoCreado?.id).toBe('p1');
    expect(component.pagoConfirmado).toBe(true);
    expect(pedidoServiceSpy.escucharPedido).toHaveBeenCalledWith('p1');
  });

  it('permite confirmar el pago manualmente desde la vista QR', async () => {
    component.pedidoCreado = { id: 'p2', numero: 'VS-200', estado: 'pendiente_pago', hora: '12:00', total: 80 };
    component.pagoConfirmado = false;
    component.esperandoConfirmacionPago = true;

    await component.confirmarPagoManual();

    expect(pedidoServiceSpy.confirmarPago).toHaveBeenCalledWith('p2');
    expect(component.pagoConfirmado).toBe(true);
    expect(component.esperandoConfirmacionPago).toBe(false);
    expect(component.pedidoCreado?.estado).toBe('pendiente');
  });

  it('usa pipe bolivianos en la plantilla y evita simbolo dolar', () => {
    const templatePath = resolve(process.cwd(), 'src/app/components/checkout/checkout.html');
    const template = readFileSync(templatePath, 'utf-8');

    expect(template).toContain('| bolivianos');
    expect(template).not.toContain('$');
  });

  it('incluye el codigo BOB en la referencia de pago', () => {
    component.pedidoCreado = { id: 'p1', numero: 'VS-100', estado: 'pendiente_pago', hora: '11:00', total: 59 };
    const ref = component.referenciaPago;

    expect(ref).toContain('|BOB|');
    expect(ref).not.toContain('$');
  });

  it('prioriza los datos de pago del backend para QR y referencia', () => {
    component.pedidoCreado = {
      id: 'p3',
      numero: 'VS-300',
      estado: 'pendiente_pago',
      hora: '13:00',
      total: 99,
      pago: {
        proveedor: 'mercadopago',
        referencia: 'PREF-123',
        paymentUrl: 'https://mpago.la/abc',
        qrData: 'https://mpago.la/abc'
      }
    };

    expect(component.referenciaPago).toBe('PREF-123');
    expect(component.pagoUrl).toBe('https://mpago.la/abc');
    expect(component.qrPagoContenido).toBe('https://mpago.la/abc');
  });
});

