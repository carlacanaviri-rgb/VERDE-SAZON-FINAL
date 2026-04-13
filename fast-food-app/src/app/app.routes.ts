import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { ProductosComponent } from './components/productos/productos';
import { MenuComponent } from './components/menu/menu';
import { authGuard, adminGuard } from './guards/auth-guard';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'menu', component: MenuComponent, canActivate: [authGuard] },
  { path: 'productos', component: ProductosComponent, canActivate: [adminGuard] },
  { path: 'admin', component: ProductosComponent, canActivate: [adminGuard] },
];
