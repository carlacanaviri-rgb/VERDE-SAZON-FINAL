import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { vi } from 'vitest';

import { ProductosComponent } from './productos';
import { ProductoService } from '../../services/producto.service';
import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
import { CoberturaService } from '../../services/cobertura.service';

describe('ProductosComponent', () => {
  let component: ProductosComponent;
  let fixture: ComponentFixture<ProductosComponent>;
  let productoServiceSpy: {
    getProductos: ReturnType<typeof vi.fn>;
    addProducto: ReturnType<typeof vi.fn>;
    updateProducto: ReturnType<typeof vi.fn>;
    deleteProducto: ReturnType<typeof vi.fn>;
  };

  const translateServiceSpy = {
    use: vi.fn(),
    instant: vi.fn((key: string) => key),
  };

  beforeEach(async () => {
    productoServiceSpy = {
      getProductos: vi.fn(),
      addProducto: vi.fn(),
      updateProducto: vi.fn(),
      deleteProducto: vi.fn()
    };

    productoServiceSpy.getProductos.mockReturnValue(of([]));
    productoServiceSpy.addProducto.mockReturnValue(Promise.resolve());
    productoServiceSpy.updateProducto.mockReturnValue(Promise.resolve());
    productoServiceSpy.deleteProducto.mockReturnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [ProductosComponent],
      providers: [
        { provide: ProductoService, useValue: productoServiceSpy as unknown as ProductoService },
        { provide: AuthService, useValue: { logout: vi.fn().mockResolvedValue(undefined) } },
        { provide: ClienteService, useValue: { getRankingTop: vi.fn().mockReturnValue(of([])) } },
        {
          provide: CoberturaService,
          useValue: {
            getZonasCobertura: vi.fn().mockReturnValue(of([])),
            addZona: vi.fn().mockResolvedValue(undefined),
            updateZona: vi.fn().mockResolvedValue(undefined)
          }
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: TranslateService, useValue: translateServiceSpy }
      ]
    })
      .overrideComponent(ProductosComponent, {
        set: { template: '' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(ProductosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should block save when required fields are missing or price is zero', async () => {
    component.form = {
      nombre: '   ',
      categoria: '',
      descripcion: 'Descripcion valida',
      precio: 0,
      disponible: true
    };

    await component.guardar();

    expect(productoServiceSpy.addProducto).not.toHaveBeenCalled();
    expect(component.errores['nombre']).toBeTruthy();
    expect(component.errores['categoria']).toBeTruthy();
    expect(component.errores['precio']).toBeTruthy();
  });

  it('should trim fields and save valid product', async () => {
    component.form = {
      nombre: '  Pique  ',
      categoria: ' vegetariano ',
      descripcion: ' Version Vegetariana ',
      precio: 60,
      disponible: true
    };

    await component.guardar();

    expect(productoServiceSpy.addProducto).toHaveBeenCalledWith(expect.objectContaining({
      nombre: 'Pique',
      categoria: 'vegetariano',
      descripcion: 'Version Vegetariana',
      precio: 60
    }));
  });
});
