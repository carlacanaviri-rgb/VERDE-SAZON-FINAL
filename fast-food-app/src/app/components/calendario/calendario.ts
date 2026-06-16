import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CalendarioService } from '../../services/calendario.service';
import {
  EventoCalendario,
  EventoCalendarioInput,
  TipoEvento,
  EstadoEvento,
  TIPO_COLORES,
  ESTADO_COLORES,
  ItemCalendario,
} from '../../models/calendario.model';

type VistaCalendario = 'mes' | 'semana' | 'lista';

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css',
})
export class Calendario implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private calSvc = inject(CalendarioService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  // ─── Estado UI ───────────────────────────────────────────────
  vista: VistaCalendario = 'mes';
  cargando = true;
  importando = false;
  importadosOk: number | null = null;
  errorMsg = '';

  // ─── Fecha navegación ────────────────────────────────────────
  hoy = new Date();
  fechaActual = new Date(); // mes/semana que se está viendo

  // ─── Datos ───────────────────────────────────────────────────
  eventos: EventoCalendario[] = [];
  private sub?: Subscription;

  // ─── Modal nuevo/editar evento ───────────────────────────────
  modalAbierto = false;
  editando: EventoCalendario | null = null;
  form: EventoCalendarioInput = this.formVacio();

  // ─── Modal detalle ────────────────────────────────────────────
  detalleEvento: EventoCalendario | null = null;

  // ─── Items del formulario ─────────────────────────────────────
  nuevoItemNombre = '';
  nuevoItemCantidad = 1;
  nuevoItemPrecio = 0;

  // ─── Exponer colores a template ───────────────────────────────
  tipoColores = TIPO_COLORES;
  estadoColores = ESTADO_COLORES;
  meses = MESES;
  diasSemana = DIAS_SEMANA;

  // ─── Filtros ─────────────────────────────────────────────────
  filtroTipo: TipoEvento | 'todos' = 'todos';
  tiposEvento: TipoEvento[] = ['programado', 'pendiente', 'historial', 'planificacion'];

  // ─── Getters navegación ───────────────────────────────────────
  get mesActualLabel(): string {
    return `${MESES[this.fechaActual.getMonth()]} ${this.fechaActual.getFullYear()}`;
  }

  get semanaActualLabel(): string {
    const lunes = this.getLunes(this.fechaActual);
    const domingo = new Date(lunes);
    domingo.setDate(domingo.getDate() + 6);
    const fmt = (d: Date) => `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`;
    return `${fmt(lunes)} – ${fmt(domingo)} ${domingo.getFullYear()}`;
  }

  // ─── Lifecycle ───────────────────────────────────────────────
  ngOnInit() {
    const uid = this.auth.usuarioLogueado?.uid;
    if (!uid) {
      this.router.navigate(['/login']);
      return;
    }

    this.sub = this.calSvc.getEventos(uid).subscribe({
      next: (evs) => {
        // El callback de Firestore puede llegar fuera de la zona de Angular;
        // run() asegura que la vista se actualice dinámicamente en cada cambio.
        this.zone.run(() => {
          this.eventos = evs;
          this.cargando = false;
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        console.error(err);
        this.zone.run(() => {
          this.cargando = false;
          this.errorMsg = 'Error cargando el calendario. Revisa tu conexión.';
          this.cdr.markForCheck();
        });
      },
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  // ─── Navegación ──────────────────────────────────────────────
  navAnterior() {
    const d = new Date(this.fechaActual);
    if (this.vista === 'mes') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    this.fechaActual = d;
  }

  navSiguiente() {
    const d = new Date(this.fechaActual);
    if (this.vista === 'mes') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    this.fechaActual = d;
  }

  irAHoy() {
    this.fechaActual = new Date();
  }

  // ─── Vista Mes: celdas ───────────────────────────────────────
  get celdaMes(): { fecha: Date; fuera: boolean }[] {
    const año = this.fechaActual.getFullYear();
    const mes = this.fechaActual.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const celdas: { fecha: Date; fuera: boolean }[] = [];

    // Días del mes anterior para completar la primera semana
    const inicioSemana = primerDia.getDay(); // 0=dom
    for (let i = inicioSemana - 1; i >= 0; i--) {
      const d = new Date(año, mes, -i);
      celdas.push({ fecha: d, fuera: true });
    }
    // Días del mes
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      celdas.push({ fecha: new Date(año, mes, d), fuera: false });
    }
    // Días del siguiente mes para completar la última semana
    const restantes = 7 - (celdas.length % 7 || 7);
    for (let i = 1; i <= restantes; i++) {
      celdas.push({ fecha: new Date(año, mes + 1, i), fuera: true });
    }
    return celdas;
  }

  // ─── Vista Semana ────────────────────────────────────────────
  get diasSemanaActual(): Date[] {
    const lunes = this.getLunes(this.fechaActual);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(d.getDate() + i);
      return d;
    });
  }

  private getLunes(fecha: Date): Date {
    const d = new Date(fecha);
    const dia = d.getDay();
    const diff = dia === 0 ? -6 : 1 - dia;
    d.setDate(d.getDate() + diff);
    return d;
  }

  // ─── Eventos por fecha ───────────────────────────────────────
  eventosDeFecha(fecha: Date): EventoCalendario[] {
    const clave = this.toYMD(fecha);
    return this.eventosFiltrados.filter((e) => e.fecha === clave);
  }

  get eventosFiltrados(): EventoCalendario[] {
    if (this.filtroTipo === 'todos') return this.eventos;
    return this.eventos.filter((e) => e.tipo === this.filtroTipo);
  }

  get eventosDelMes(): EventoCalendario[] {
    const año = this.fechaActual.getFullYear();
    const mes = this.fechaActual.getMonth();
    return this.eventosFiltrados.filter((e) => {
      const d = new Date(e.fecha + 'T00:00:00');
      return d.getFullYear() === año && d.getMonth() === mes;
    });
  }

  get eventosOrdenados(): EventoCalendario[] {
    return [...this.eventosFiltrados].sort((a, b) => {
      const fa = a.fecha + 'T' + (a.hora || '00:00');
      const fb = b.fecha + 'T' + (b.hora || '00:00');
      return fa.localeCompare(fb);
    });
  }

  // ─── Utilidades fecha ─────────────────────────────────────────
  toYMD(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dia}`;
  }

  esHoy(fecha: Date): boolean {
    return this.toYMD(fecha) === this.toYMD(this.hoy);
  }

  formatFechaCorta(ymd: string): string {
    const d = new Date(ymd + 'T00:00:00');
    return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
  }

  // ─── Modal nuevo evento ───────────────────────────────────────
  abrirNuevo(fecha?: Date) {
    this.editando = null;
    this.form = this.formVacio();
    if (fecha) this.form.fecha = this.toYMD(fecha);
    this.modalAbierto = true;
  }

  abrirEditar(ev: EventoCalendario) {
    this.detalleEvento = null;
    this.editando = ev;
    this.form = {
      tipo: ev.tipo,
      titulo: ev.titulo,
      fecha: ev.fecha,
      hora: ev.hora,
      items: [...ev.items.map((i) => ({ ...i }))],
      total: ev.total,
      estado: ev.estado,
      nota: ev.nota ?? '',
      direccionEntrega: ev.direccionEntrega ?? '',
    };
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.editando = null;
    this.form = this.formVacio();
    this.nuevoItemNombre = '';
    this.nuevoItemCantidad = 1;
    this.nuevoItemPrecio = 0;
  }

  formVacio(): EventoCalendarioInput {
    return {
      tipo: 'programado',
      titulo: '',
      fecha: this.toYMD(new Date()),
      hora: '12:00',
      items: [],
      total: 0,
      estado: 'pendiente',
      nota: '',
      direccionEntrega: '',
    };
  }

  // ─── Items del formulario ─────────────────────────────────────
  agregarItem() {
    if (!this.nuevoItemNombre.trim()) return;
    this.form.items.push({
      nombre: this.nuevoItemNombre.trim(),
      cantidad: this.nuevoItemCantidad || 1,
      precio: this.nuevoItemPrecio || 0,
    });
    this.calcularTotal();
    this.nuevoItemNombre = '';
    this.nuevoItemCantidad = 1;
    this.nuevoItemPrecio = 0;
  }

  quitarItem(i: number) {
    this.form.items.splice(i, 1);
    this.calcularTotal();
  }

  calcularTotal() {
    this.form.total = this.form.items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  }

  // ─── Guardar evento ───────────────────────────────────────────
  async guardarEvento() {
    const uid = this.auth.usuarioLogueado?.uid;
    if (!uid || !this.form.titulo.trim() || !this.form.fecha) return;

    try {
      if (this.editando?.id) {
        await this.calSvc.actualizarEvento(this.editando.id, this.form);
      } else {
        await this.calSvc.crearEvento(uid, this.form);
      }
      this.cerrarModal();
    } catch (e) {
      console.error(e);
      this.errorMsg = 'Error al guardar el evento.';
    }
  }

  // ─── Eliminar evento ──────────────────────────────────────────
  async eliminarEvento(id?: string) {
    if (!id) return;
    if (!confirm('¿Eliminar este evento del calendario?')) return;
    try {
      await this.calSvc.eliminarEvento(id);
      this.detalleEvento = null;
    } catch (e) {
      console.error(e);
      this.errorMsg = 'Error al eliminar el evento.';
    }
  }

  // ─── Importar historial ──────────────────────────────────────
  async importarHistorial() {
    const uid = this.auth.usuarioLogueado?.uid;
    if (!uid) return;
    this.importando = true;
    try {
      const n = await this.calSvc.importarHistorialPedidos(uid);
      this.importadosOk = n;
      setTimeout(() => (this.importadosOk = null), 4000);
    } catch (e) {
      console.error(e);
      this.errorMsg = 'Error importando el historial.';
    } finally {
      this.importando = false;
    }
  }

  // ─── Detalle modal ────────────────────────────────────────────
  verDetalle(ev: EventoCalendario) {
    this.detalleEvento = ev;
  }

  cerrarDetalle() {
    this.detalleEvento = null;
  }

  // ─── Estadísticas rápidas ────────────────────────────────────
  get totalEventosMes(): number {
    return this.eventosDelMes.length;
  }
  get totalGastadoMes(): number {
    return this.eventosDelMes
      .filter((e) => e.tipo === 'historial' || e.estado === 'entregado')
      .reduce((acc, e) => acc + (e.total || 0), 0);
  }
  get proximoPedido(): EventoCalendario | null {
    const hoyStr = this.toYMD(this.hoy);
    return (
      this.eventos
        .filter((e) => e.fecha >= hoyStr && e.tipo === 'programado')
        .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0] ?? null
    );
  }

  volver() {
    this.router.navigate(['/menu']);
  }

  // ↓↓↓ AÑADIR ESTOS TRES MÉTODOS ↓↓↓
  // ─── Helpers de hover/foco ───────────────────────────────────
  // Evitan acceder a `.style` sobre EventTarget (que puede ser null) en la
  // plantilla, lo cual rompe strictTemplates. El cast se hace aquí en TS.
  setBg(e: Event, color: string) {
    const el = e.currentTarget as HTMLElement | null;
    if (el) el.style.background = color;
  }

  setShadow(e: Event, shadow: string) {
    const el = e.currentTarget as HTMLElement | null;
    if (el) el.style.boxShadow = shadow;
  }

  setBorderColor(e: Event, color: string) {
    const el = e.target as HTMLElement | null;
    if (el) el.style.borderColor = color;
  }
}
