import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { ProductosComponent } from './components/productos/productos';
import { MenuComponent } from './components/menu/menu';
import { adminGuard, cocinaGuard } from './guards/auth-guard';
import { LandingComponent } from './components/landing/landing';
import { CocinaComponent } from './components/cocina/cocina';


export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'productos', component: ProductosComponent, canActivate: [adminGuard] },
  { path: 'admin', component: ProductosComponent, canActivate: [adminGuard] },
  { path: 'cocina', component: CocinaComponent, canActivate: [cocinaGuard] },
];
