import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardAdminService } from '../../services/dashboard-admin.service';
import { ResumenAdmin } from '../../models/dashboard-admin.model';
import { BolivianoCurrencyPipe } from '../../shared/pipes/boliviano-currency.pipe';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, BolivianoCurrencyPipe],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.css',
})
export class DashboardAdmin implements OnInit {
  private svc = inject(DashboardAdminService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  cargando = true;
  errorMsg = '';
  data: ResumenAdmin | null = null;

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    this.cargando = true;
    this.errorMsg = '';
    try {
      this.data = await this.svc.getResumen();
    } catch (e) {
      console.error('[DashboardAdmin] error:', e);
      this.errorMsg = 'No se pudo cargar el dashboard.';
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  // ── Helpers de visualización ────────────────────────────────────
  maxPlato(): number {
    return Math.max(1, ...(this.data?.platosTop.map((p) => p.cantidad) ?? [1]));
  }

  maxSegmento(): number {
    return Math.max(1, ...(this.data?.segmentos.map((s) => s.cantidad) ?? [1]));
  }

  maxProgramado(): number {
    return Math.max(1, ...(this.data?.programadosPorDia.map((d) => d.cantidad) ?? [1]));
  }

  pct(valor: number, max: number): number {
    return Math.round((valor / max) * 100);
  }

  colorSegmento(nombre: string): string {
    if (nombre === 'VIP') return '#7c3aed';
    if (nombre === 'Recurrente') return '#1d9e75';
    if (nombre === 'Nuevo') return '#3b82f6';
    return '#9ca3af';
  }

  formatFecha(ymd: string): string {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    const d = new Date(ymd + 'T00:00:00');
    return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
  }

  volverAdmin() {
    this.router.navigate(['/admin']);
  }
}
