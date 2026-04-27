import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './register.html',
})
export class RegisterComponent {
  nombre = '';
  email = '';
  password = '';
  confirmar = '';
  error = '';
  cargando = false;
  mostrarPassword = false;
  mostrarConfirmar = false;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  get passwordsCoinciden(): boolean {
    return !this.confirmar || this.password === this.confirmar;
  }

  get formularioValido(): boolean {
    return (
      this.nombre.trim().length >= 2 &&
      this.email.includes('@') &&
      this.password.length >= 6 &&
      this.password === this.confirmar
    );
  }

  async registrar() {
    if (!this.formularioValido || this.cargando) return;
    this.cargando = true;
    this.error = '';
    try {
      await this.auth.register(this.nombre.trim(), this.email.trim(), this.password);
      this.router.navigate(['/menu']);
    } catch (e: any) {
      this.error = this.traducirError(e.code);
    } finally {
      this.cargando = false;
    }
  }

  private traducirError(code: string): string {
    const map: Record<string, string> = {
      'auth/email-already-in-use': 'Este correo ya está registrado. ¿Querés iniciar sesión?',
      'auth/invalid-email': 'El formato del correo no es válido.',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
      'auth/network-request-failed': 'Sin conexión a internet. Intentá de nuevo.',
    };
    return map[code] ?? 'Ocurrió un error al crear la cuenta. Intentá de nuevo.';
  }

  irLogin() {
    this.router.navigate(['/login']);
  }
  irLanding() {
    this.router.navigate(['/']);
  }
}
