import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { ProductosComponent } from './components/productos/productos';
import { MenuComponent } from './components/menu/menu';
import { adminGuard, authGuard, cocinaGuard } from './guards/auth-guard';
import { LandingComponent } from './components/landing/landing';
import { CocinaComponent } from './components/cocina/cocina';
import { CheckoutComponent } from './components/checkout/checkout';


export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'checkout/qr', component: CheckoutComponent, canActivate: [authGuard] },
  { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
  { path: 'productos', component: ProductosComponent, canActivate: [adminGuard] },
  { path: 'admin', component: ProductosComponent, canActivate: [adminGuard] },
  { path: 'cocina', component: CocinaComponent, canActivate: [cocinaGuard] },
];
