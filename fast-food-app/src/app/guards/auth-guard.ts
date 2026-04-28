import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { take, switchMap, filter, map } from 'rxjs';

/** Espera hasta que el rol esté cargado (no null) y retorna el primer valor */
function waitForRol(auth: AuthService) {
  return auth.rol$.pipe(
    filter((r) => r !== null),
    take(1),
  );
}

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.usuario$.pipe(
    take(1),
    switchMap((user) => {
      if (!user) {
        router.navigate(['/login']);
        return [false];
      }
      return [true];
    }),
  );
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.usuario$.pipe(
    take(1),
    switchMap((user) => {
      if (!user) {
        router.navigate(['/login']);
        return [false];
      }
      return waitForRol(auth).pipe(
        map((rol) => {
          if (rol !== 'admin') {
            router.navigate(['/menu']);
            return false;
          }
          return true;
        }),
      );
    }),
  );
};

export const cocinaGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.usuario$.pipe(
    take(1),
    switchMap((user) => {
      if (!user) {
        router.navigate(['/login']);
        return [false];
      }
      return waitForRol(auth).pipe(
        map((rol) => {
          if (rol !== 'cocina') {
            router.navigate(['/login']);
            return false;
          }
          return true;
        }),
      );
    }),
  );
};

export const deliveryGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.usuario$.pipe(
    take(1),
    switchMap((user) => {
      if (!user) {
        router.navigate(['/login']);
        return [false];
      }
      return waitForRol(auth).pipe(
        map((rol) => {
          if (rol !== 'delivery' && rol !== 'admin') {
            router.navigate(['/menu']);
            return false;
          }
          return true;
        }),
      );
    }),
  );
};
