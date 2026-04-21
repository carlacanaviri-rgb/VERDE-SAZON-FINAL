import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { MenuComponent } from './menu';
import { ProductoService } from '../../services/producto.service';
import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuComponent],
      providers: [
        { provide: ProductoService, useValue: { getProductos: () => of([]) } },
        { provide: AuthService, useValue: { usuario$: of(null), logout: () => Promise.resolve() } },
        { provide: ClienteService, useValue: { getPerfil: () => of({ clienteId: 'x', clasificacion: 'Nuevo', pedidosCompletados: 0, montoTotalCompletado: 0 }) } },
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
});
