import { inject, Injectable } from '@angular/core';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { BehaviorSubject, filter, take } from 'rxjs';
import { getFirebaseApp } from './firebase-app';
import { CartService } from './cart.service';

const app = getFirebaseApp();
const auth = getAuth(app);
const db = getFirestore(app);

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly cartSvc = inject(CartService);

  private usuarioActual = new BehaviorSubject<User | null>(null);
  private rolActual = new BehaviorSubject<string | null>(null);
  private inicializado = new BehaviorSubject<boolean>(false);

  usuario$ = this.usuarioActual.asObservable();
  rol$ = this.rolActual.asObservable();
  /** Emite true una sola vez cuando Firebase ya resolvió la sesión guardada */
  listo$ = this.inicializado.pipe(
    filter((v) => v),
    take(1),
  );

  constructor() {
    onAuthStateChanged(auth, async (user) => {
      this.usuarioActual.next(user);
      this.cartSvc.setStorageOwner(user?.uid ?? null);
      if (user) {
        const rol = await this.obtenerRol(user.uid);
        this.rolActual.next(rol);
      } else {
        this.rolActual.next(null);
      }
      // Marca como listo después del primer disparo (con o sin sesión)
      this.inicializado.next(true);
    });
  }

  private async obtenerRol(uid: string, intentos = 3): Promise<string> {
    for (let i = 0; i < intentos; i++) {
      try {
        const snap = await getDoc(doc(db, 'usuarios', uid));
        if (snap.exists()) return snap.data()['rol'];
        return 'cliente';
      } catch (e: any) {
        const esPermisos = e?.code === 'permission-denied';
        if (esPermisos && i < intentos - 1) {
          // Espera un poco y reintenta — el token de Auth puede no haberse propagado aún
          await new Promise((r) => setTimeout(r, 800 * (i + 1)));
          continue;
        }
        console.error('Error obteniendo rol:', e);
        return 'cliente';
      }
    }
    return 'cliente';
  }

  async login(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const rol = await this.obtenerRol(result.user.uid);
    this.rolActual.next(rol);
    return { user: result.user, rol };
  }

  async register(nombre: string, email: string, password: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const uid = result.user.uid;
    await setDoc(doc(db, 'usuarios', uid), {
      email,
      nombre,
      rol: 'cliente',
      clasificacionCliente: 'Nuevo',
      pedidosCompletados: 0,
      montTotalCompletado: 0,
      clasificacionActualizadaEn: new Date().toISOString(),
    });
    this.rolActual.next('cliente');
    return { user: result.user, rol: 'cliente' };
  }

  logout() {
    return signOut(auth);
  }

  get usuarioLogueado(): User | null {
    return this.usuarioActual.value;
  }

  get rolUsuario(): string | null {
    return this.rolActual.value;
  }
}
