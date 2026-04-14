import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { LangSwitchComponent } from '../lang-switch/lang-switch';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, TranslateModule, LangSwitchComponent],
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
    if (rol === 'admin') this.router.navigate(['/admin']);
    else if (rol === 'cocina') this.router.navigate(['/cocina']);
    else this.router.navigate(['/menu']);
  } catch (e: any) {
    this.error = 'LOGIN.ERROR';
  } finally {
    this.cargando = false;
  }
}
}
