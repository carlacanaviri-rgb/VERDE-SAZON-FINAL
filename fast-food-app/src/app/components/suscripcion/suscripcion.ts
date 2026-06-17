import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SuscripcionService } from '../../services/suscripcion.service';
import { PerfilNutricionalService } from '../../services/perfil-nutricional.service';
import { CalendarioService } from '../../services/calendario.service';
import { EventoCalendario } from '../../models/calendario.model';
import {
  Suscripcion,
  FRANJAS_HORARIAS,
  DIAS_SEMANA,
  TIPOS_DIETA,
  FranjaHoraria,
  PLANES,
  PlanPreset,
} from '../../models/suscripcion.model';
import { TipoDieta } from '../../models/perfil-nutricional.model';

@Component({
  selector: 'app-suscripcion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suscripcion.html',
  styleUrl: './suscripcion.css',
})
export class SuscripcionComponent implements OnInit {
  private auth = inject(AuthService);
  private svc = inject(SuscripcionService);
  private perfilSvc = inject(PerfilNutricionalService);
  private calSvc = inject(CalendarioService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  readonly franjas = FRANJAS_HORARIAS;
  readonly dias = DIAS_SEMANA;
  readonly tiposDieta = TIPOS_DIETA;
  readonly planes = PLANES;

  cargando = true;
  guardando = false;
  okMsg = '';
  errorMsg = '';

  sub: Suscripcion = this.vacia();
  entregas: EventoCalendario[] = [];

  ngOnInit() {
    const uid = this.auth.usuarioLogueado?.uid;
    if (!uid) {
      this.router.navigate(['/login']);
      return;
    }
    this.cargar(uid);
  }

  private vacia(): Suscripcion {
    return {
      activa: false,
      pausada: false,
      pausaHasta: '',
      plan: 'Estándar',
      comidasPorSemana: 5,
      diasPreferidos: [],
      horariosPreferidos: [],
      tipoDieta: 'Sin restricción',
      notas: '',
      actualizadoEn: '',
    };
  }

  async cargar(uid: string) {
    this.cargando = true;
    try {
      const existente = await this.svc.getSuscripcion(uid);
      if (existente) {
        this.sub = { ...this.vacia(), ...existente };
      } else {
        const perfil = await this.perfilSvc.getPerfil(uid);
        if (perfil?.tipoDieta) this.sub.tipoDieta = perfil.tipoDieta;
      }
      // Entregas programadas (para reprogramar)
      this.entregas = await this.calSvc.getEntregasProgramadas(uid);
    } catch (e) {
      console.error('[Suscripcion] error cargando:', e);
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  // ── Días preferidos ─────────────────────────────────────────────
  toggleDia(d: string) {
    const i = this.sub.diasPreferidos.indexOf(d);
    if (i >= 0) this.sub.diasPreferidos.splice(i, 1);
    else this.sub.diasPreferidos.push(d);
  }
  tieneDia(d: string): boolean {
    return this.sub.diasPreferidos.includes(d);
  }

  // ── Horarios preferidos ─────────────────────────────────────────
  toggleHorario(h: FranjaHoraria) {
    const i = this.sub.horariosPreferidos.indexOf(h);
    if (i >= 0) this.sub.horariosPreferidos.splice(i, 1);
    else this.sub.horariosPreferidos.push(h);
  }
  tieneHorario(h: FranjaHoraria): boolean {
    return this.sub.horariosPreferidos.includes(h);
  }

  // ── Tipo de dieta ───────────────────────────────────────────────
  setDieta(d: TipoDieta) {
    this.sub.tipoDieta = d;
  }

  // ── Comidas por semana ──────────────────────────────────────────
  // ── Comidas por semana ──────────────────────────────────────────
  ajustarComidas(delta: number) {
    const v = this.sub.comidasPorSemana + delta;
    this.sub.comidasPorSemana = Math.min(14, Math.max(1, v));
    this.sub.plan = 'Personalizado';
  }

  // ── Cambiar de plan ─────────────────────────────────────────────
  seleccionarPlan(p: PlanPreset) {
    this.sub.plan = p.nombre;
    if (p.comidasPorSemana > 0) {
      this.sub.comidasPorSemana = p.comidasPorSemana;
    }
  }

  // ── Pausar / reanudar ───────────────────────────────────────────
  togglePausa() {
    this.sub.pausada = !this.sub.pausada;
    if (!this.sub.pausada) this.sub.pausaHasta = '';
  }

  estadoTexto(): string {
    if (!this.sub.activa) return 'Inactiva';
    return this.sub.pausada ? 'En pausa' : 'Activa';
  }

  estadoClase(): string {
    if (!this.sub.activa) return 'off';
    return this.sub.pausada ? 'paused' : 'on';
  }

  // ── Reprogramar entregas ────────────────────────────────────────
  async reprogramar(ev: EventoCalendario, e: Event) {
    const nuevaFecha = (e.target as HTMLInputElement).value;
    if (!ev.id || !nuevaFecha || nuevaFecha === ev.fecha) return;
    try {
      await this.calSvc.actualizarEvento(ev.id, { fecha: nuevaFecha });
      ev.fecha = nuevaFecha;
      this.entregas = [...this.entregas].sort((a, b) => a.fecha.localeCompare(b.fecha));
      this.flash('Entrega reprogramada.');
    } catch (err) {
      console.error('[Suscripcion] error reprogramando:', err);
      this.errorMsg = 'No se pudo reprogramar la entrega.';
    }
  }

  private flash(msg: string) {
    this.okMsg = msg;
    setTimeout(() => (this.okMsg = ''), 3500);
  }

  async guardar() {
    const uid = this.auth.usuarioLogueado?.uid;
    if (!uid) return;
    this.guardando = true;
    this.errorMsg = '';
    this.okMsg = '';
    try {
      await this.svc.saveSuscripcion(uid, this.sub);
      this.okMsg = 'Suscripción guardada correctamente.';
      setTimeout(() => (this.okMsg = ''), 3500);
    } catch (e) {
      console.error('[Suscripcion] error guardando:', e);
      this.errorMsg = 'No se pudo guardar. Revisa tu conexión.';
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  volver() {
    this.router.navigate(['/menu']);
  }
}
