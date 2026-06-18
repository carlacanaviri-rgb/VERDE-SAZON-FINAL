import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// 👇 Importamos el componente del selector de idioma
import { LangSwitchComponent } from '../lang-switch/lang-switch';

@Component({
  selector: 'app-register',
  standalone: true,
  // 👇 Añadido el LangSwitchComponent a los imports
  imports: [CommonModule, FormsModule, TranslateModule, LangSwitchComponent],
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

  private translate = inject(TranslateService);

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
      'auth/email-already-in-use': this.translate.instant('REGISTRO.ERR_EMAIL_IN_USE'),
      'auth/invalid-email': this.translate.instant('REGISTRO.ERR_INVALID_EMAIL'),
      'auth/weak-password': this.translate.instant('REGISTRO.ERR_WEAK_PWD'),
      'auth/network-request-failed': this.translate.instant('REGISTRO.ERR_NETWORK'),
    };
    return map[code] ?? this.translate.instant('REGISTRO.ERR_DEFAULT');
  }

  irLogin() {
    this.router.navigate(['/login']);
  }
  irLanding() {
    this.router.navigate(['/']);
  }
}
