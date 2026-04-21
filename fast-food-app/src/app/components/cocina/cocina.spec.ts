import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { CocinaComponent } from './cocina';
import { PedidoService } from '../../services/pedido.service';
import { AuthService } from '../../services/auth.service';

describe('CocinaComponent', () => {
  let component: CocinaComponent;
  let fixture: ComponentFixture<CocinaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CocinaComponent],
      providers: [
        { provide: PedidoService, useValue: { getPedidos: () => of([]), cambiarEstado: () => undefined } },
        { provide: AuthService, useValue: { logout: () => Promise.resolve() } },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
      ],
    })
      .overrideComponent(CocinaComponent, {
        set: { template: '' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(CocinaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
