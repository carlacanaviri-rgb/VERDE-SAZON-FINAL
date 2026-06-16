import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { ProductosComponent } from './components/productos/productos';
import { MenuComponent } from './components/menu/menu';
import { adminGuard, authGuard, cocinaGuard, deliveryGuard } from './guards/auth-guard';
import { LandingComponent } from './components/landing/landing';
import { CocinaComponent } from './components/cocina/cocina';
import { CheckoutComponent } from './components/checkout/checkout';
import { DeliveryComponent } from './components/delivery/delivery';
import { SeguimientoComponent } from './components/seguimiento/seguimiento';
import { RegisterComponent } from './components/register/register';
import { PerfilNutricionalComponent } from './components/perfil-nutricional/perfil-nutricional';
import { Calendario } from './components/calendario/calendario';
import { Planificador } from './components/planificador/planificador';



export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'perfil-nutricional', component: PerfilNutricionalComponent, canActivate: [authGuard] },
  { path: 'checkout/qr', component: CheckoutComponent, canActivate: [authGuard] },
  { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
  { path: 'seguimiento/:id', component: SeguimientoComponent, canActivate: [authGuard] },
  { path: 'productos', component: ProductosComponent, canActivate: [adminGuard] },
  { path: 'admin', component: ProductosComponent, canActivate: [adminGuard] },
  { path: 'cocina', component: CocinaComponent, canActivate: [cocinaGuard] },
  { path: 'delivery', component: DeliveryComponent, canActivate: [deliveryGuard] },
  { path: 'perfil-nutricional', component: PerfilNutricionalComponent, canActivate: [authGuard] },
  { path: 'calendario', component: Calendario, canActivate: [authGuard] },
  { path: 'planificador', component: Planificador, canActivate: [authGuard] },
];
