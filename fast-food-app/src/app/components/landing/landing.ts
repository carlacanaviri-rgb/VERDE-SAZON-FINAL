import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LangSwitchComponent } from '../lang-switch/lang-switch';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [TranslateModule, LangSwitchComponent],
  templateUrl: './landing.html',
})
export class LandingComponent {
  constructor(private router: Router) {}
  irLogin() {
    this.router.navigate(['/login']);
  }
  irRegistro() {
    this.router.navigate(['/registro']);
  }
}
