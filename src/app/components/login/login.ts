import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  error = '';
  cargando = false;

async login() {
  this.error = '';
  this.cargando = true;
  try {
    const { rol } = await this.auth.login(this.email, this.password);
    this.router.navigate([rol === 'admin' ? '/admin' : '/menu']);
  } catch (e: any) {
    this.error = 'Credenciales incorrectas. Intenta de nuevo.';
  } finally {
    this.cargando = false;
  }
}
}