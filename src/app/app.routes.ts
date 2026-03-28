import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { ProductosComponent } from './components/productos/productos';
import { authGuard } from './guards/auth-guard';
import { MenuComponent } from './components/menu/menu';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'productos', component: ProductosComponent, canActivate: [authGuard] },
   { path: 'menu', component: MenuComponent },
  { path: 'admin', component: ProductosComponent, canActivate: [authGuard] },
];