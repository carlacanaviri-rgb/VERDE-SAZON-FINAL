import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Planificador } from './planificador';

describe('Planificador', () => {
  let component: Planificador;
  let fixture: ComponentFixture<Planificador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Planificador],
    }).compileComponents();

    fixture = TestBed.createComponent(Planificador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
