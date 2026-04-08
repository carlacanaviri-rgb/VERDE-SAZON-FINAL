import { Injectable } from '@angular/core';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getApps, initializeApp, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

const app = getApps().length === 0 ? initializeApp(environment.firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

@Injectable({ providedIn: 'root' })
export class AuthService {

  private usuarioActual = new BehaviorSubject<User | null>(null);
  private rolActual = new BehaviorSubject<string | null>(null);

  usuario$ = this.usuarioActual.asObservable();
  rol$ = this.rolActual.asObservable();

  constructor() {
    onAuthStateChanged(auth, async user => {
      this.usuarioActual.next(user);
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
    console.log('Buscando UID:', uid);
    const snap = await getDoc(doc(db, 'usuarios', uid));
    console.log('Documento existe:', snap.exists());
    console.log('Datos:', snap.data());
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