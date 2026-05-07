import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { LoginComponent } from './login';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  let loginImpl: (email: string, password: string) => Promise<{ rol: string }>;
  let clearCalls = 0;

  beforeEach(async () => {
    loginImpl = async () => ({ rol: 'cliente' });
    clearCalls = 0;

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: { login: (email: string, password: string) => loginImpl(email, password) } },
        { provide: CartService, useValue: { clear: () => { clearCalls += 1; } } },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
      ],
    })
      .overrideComponent(LoginComponent, {
        set: { template: '' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should stop loading and set error when login fails', async () => {
    loginImpl = async () => {
      throw new Error('invalid credentials');
    };

    component.email = 'bad@example.com';
    component.password = 'wrong';

    const loginPromise = component.login();
    expect(component.cargando).toBe(true);

    await loginPromise;

    expect(component.cargando).toBe(false);
    expect(component.error).toBe('LOGIN.ERROR');
    expect(clearCalls).toBe(0);
  });
});
