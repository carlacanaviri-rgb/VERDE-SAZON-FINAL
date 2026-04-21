import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { LangSwitchComponent } from './lang-switch';

describe('LangSwitchComponent', () => {
  let component: LangSwitchComponent;
  let fixture: ComponentFixture<LangSwitchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LangSwitchComponent],
      providers: [{ provide: TranslateService, useValue: { use: () => undefined } }],
    }).compileComponents();

    fixture = TestBed.createComponent(LangSwitchComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
