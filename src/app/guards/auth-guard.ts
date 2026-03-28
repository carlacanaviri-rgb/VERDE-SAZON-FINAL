import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, switchMap } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.usuario$.pipe(
    take(1),
    switchMap(async user => {
      if (!user) {
        router.navigate(['/login']);
        return false;
      }
      const rol = auth.rolUsuario ?? await new Promise<string>(resolve => {
        auth.rol$.pipe(take(1)).subscribe(r => resolve(r ?? 'cliente'));
      });
      if (rol !== 'admin') {
        router.navigate(['/menu']);
        return false;
      }
      return true;
    })
  );
};