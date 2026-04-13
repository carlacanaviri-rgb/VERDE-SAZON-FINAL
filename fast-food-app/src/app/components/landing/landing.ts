import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  templateUrl: './landing.html',
})
export class LandingComponent {
  constructor(private router: Router) {}
  irLogin() { this.router.navigate(['/login']); }
}
