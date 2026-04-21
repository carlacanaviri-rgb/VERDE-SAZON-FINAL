import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { LandingComponent } from './landing';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [{ provide: Router, useValue: { navigate: () => Promise.resolve(true) } }],
    })
      .overrideComponent(LandingComponent, {
        set: { template: '' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
