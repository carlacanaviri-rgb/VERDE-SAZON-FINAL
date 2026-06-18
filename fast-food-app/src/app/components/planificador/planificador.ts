import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PlanificadorService } from '../../services/planificador.service';
import { CalendarioService } from '../../services/calendario.service';
import { DiaPlan, PlanSemanal, SugerenciaPlato } from '../../models/planificador.model';

// 👇 Importaciones necesarias para la traducción y el selector de idioma
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LangSwitchComponent } from '../lang-switch/lang-switch';

@Component({
  selector: 'app-planificador',
  standalone: true,
  // 👇 Añadido TranslateModule y LangSwitchComponent
  imports: [CommonModule, TranslateModule, LangSwitchComponent],
  templateUrl: './planificador.html',
  styleUrl: './planificador.css',
})
export class Planificador implements OnInit {
  private auth = inject(AuthService);
  private planSvc = inject(PlanificadorService);
  private calSvc = inject(CalendarioService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService); // Inyectamos el servicio de traducción

  cargando = true;
  generando = false;
  programandoTodo = false;
  errorMsg = '';
  okMsg = '';
  plan: PlanSemanal | null = null;

  ngOnInit() {
    console.log('[Planificador] ngOnInit, uid =', this.auth.usuarioLogueado?.uid);
    const uid = this.auth.usuarioLogueado?.uid;
    if (!uid) {
      this.router.navigate(['/login']);
      return;
    }
    this.generar();
  }

  async generar() {
    const uid = this.auth.usuarioLogueado?.uid;
    if (!uid) return;
    console.log('[Planificador] generar() iniciado');
    this.generando = true;
    this.errorMsg = '';
    try {
      this.plan = await this.planSvc.generarPlan(uid, 7);
      console.log('[Planificador] plan generado, opciones =', this.totalOpciones);
      if (this.totalOpciones === 0) {
        this.errorMsg = this.translate.instant('PLANIFICADOR.ERR_SIN_OPCIONES') || 'No hay platos disponibles para sugerir todavía.';
      }
    } catch (e) {
      console.error('[Planificador] error generando plan:', e);
      this.errorMsg = this.translate.instant('PLANIFICADOR.ERR_GENERAR') || 'No se pudo generar el plan. Revisa tu conexión.';
    } finally {
      this.generando = false;
      this.cargando = false;
      this.cdr.detectChanges();
      console.log('[Planificador] generar() finalizado, cargando =', this.cargando);
    }
  }

  get totalOpciones(): number {
    return this.plan?.dias.reduce((acc, d) => acc + d.opciones.length, 0) ?? 0;
  }

  get diasAceptados(): number {
    return this.plan?.dias.filter((d) => d.aceptado).length ?? 0;
  }

  /** Plato que se está mostrando para un día */
  platoActual(dia: DiaPlan): SugerenciaPlato | null {
    if (!dia.opciones.length) return null;
    return dia.opciones[dia.indice] ?? null;
  }

  /** Reemplaza la sugerencia por la siguiente del ranking */
  reemplazar(dia: DiaPlan) {
    if (dia.opciones.length <= 1) return;
    dia.indice = (dia.indice + 1) % dia.opciones.length;
    dia.aceptado = false;
    dia.programado = false;
  }

  aceptar(dia: DiaPlan) {
    if (this.platoActual(dia)) dia.aceptado = true;
  }

  /** Programa un solo día como pedido en el calendario */
  async programarDia(dia: DiaPlan) {
    const uid = this.auth.usuarioLogueado?.uid;
    const plato = this.platoActual(dia);
    if (!uid || !plato) return;
    try {
      await this.calSvc.crearEvento(uid, {
        tipo: 'programado',
        titulo: plato.producto.nombre,
        fecha: dia.fecha,
        hora: '12:30',
        items: [{ nombre: plato.producto.nombre, cantidad: 1, precio: plato.producto.precio }],
        total: plato.producto.precio,
        estado: 'pendiente',
        nota: this.translate.instant('PLANIFICADOR.NOTA_PEDIDO') || 'Sugerido por el planificador semanal',
        direccionEntrega: '',
      });
      dia.aceptado = true;
      dia.programado = true;

      const msg = this.translate.instant('PLANIFICADOR.MSG_DIA_PROGRAMADO', { nombre: plato.producto.nombre, dia: dia.nombreDia })
        || `${plato.producto.nombre} programado para el ${dia.nombreDia}`;
      this.flash(msg);
    } catch (e) {
      console.error(e);
      this.errorMsg = this.translate.instant('PLANIFICADOR.ERR_PROGRAMAR_DIA') || 'No se pudo programar el día.';
    }
  }

  /** Programa todos los días aceptados que aún no estén en el calendario */
  async programarSemana() {
    const uid = this.auth.usuarioLogueado?.uid;
    if (!uid || !this.plan) return;
    this.programandoTodo = true;
    this.errorMsg = '';
    try {
      let n = 0;
      for (const dia of this.plan.dias) {
        const plato = this.platoActual(dia);
        if (!plato || dia.programado || !dia.aceptado) continue;
        await this.calSvc.crearEvento(uid, {
          tipo: 'programado',
          titulo: plato.producto.nombre,
          fecha: dia.fecha,
          hora: '12:30',
          items: [{ nombre: plato.producto.nombre, cantidad: 1, precio: plato.producto.precio }],
          total: plato.producto.precio,
          estado: 'pendiente',
          nota: this.translate.instant('PLANIFICADOR.NOTA_PEDIDO') || 'Sugerido por el planificador semanal',
          direccionEntrega: '',
        });
        dia.programado = true;
        n++;
      }
      const msg = n > 0
        ? (this.translate.instant('PLANIFICADOR.MSG_SEMANA_PROGRAMADA', { count: n }) || `${n} pedidos programados en el calendario`)
        : (this.translate.instant('PLANIFICADOR.MSG_ACEPTA_PRIMERO') || 'Acepta al menos un día primero');
      this.flash(msg);
    } catch (e) {
      console.error(e);
      this.errorMsg = this.translate.instant('PLANIFICADOR.ERR_PROGRAMAR_SEMANA') || 'No se pudieron programar todos los días.';
    } finally {
      this.programandoTodo = false;
    }
  }

  formatFechaCorta(ymd: string): string {
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
    return `${d.getDate()} ${meses[d.getMonth()]}`;
  }

  private flash(msg: string) {
    this.okMsg = msg;
    setTimeout(() => (this.okMsg = ''), 3500);
  }

  irACalendario() {
    this.router.navigate(['/calendario']);
  }

  volver() {
    this.router.navigate(['/menu']);
  }
}
