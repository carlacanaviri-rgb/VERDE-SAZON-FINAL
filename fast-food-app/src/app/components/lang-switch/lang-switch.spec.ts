import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LangSwitch } from './lang-switch';

describe('LangSwitch', () => {
  let component: LangSwitch;
  let fixture: ComponentFixture<LangSwitch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LangSwitch],
    }).compileComponents();

    fixture = TestBed.createComponent(LangSwitch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
