import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerfilNutricional } from './perfil-nutricional';

describe('PerfilNutricional', () => {
  let component: PerfilNutricional;
  let fixture: ComponentFixture<PerfilNutricional>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilNutricional],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilNutricional);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
