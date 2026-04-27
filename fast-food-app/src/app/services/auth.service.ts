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
import { BehaviorSubject } from 'rxjs';
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

  usuario$ = this.usuarioActual.asObservable();
  rol$ = this.rolActual.asObservable();

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
    });
  }

  private async obtenerRol(uid: string): Promise<string> {
    try {
      const snap = await getDoc(doc(db, 'usuarios', uid));
      if (snap.exists()) return snap.data()['rol'];
      return 'cliente';
    } catch (e) {
      console.error('Error obteniendo rol:', e);
      return 'cliente';
    }
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
