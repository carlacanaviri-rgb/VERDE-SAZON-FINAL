import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PerfilNutricionalService } from '../../services/perfil-nutricional.service';
import {
  PerfilNutricional,
  TipoDieta,
  ObjetivoNutricional,
  RESTRICCIONES_OPCIONES,
  ALERGIAS_OPCIONES,
} from '../../models/perfil-nutricional.model';

// 👇 Importaciones necesarias para la traducción y el selector de idioma
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LangSwitchComponent } from '../lang-switch/lang-switch';

@Component({
  selector: 'app-perfil-nutricional',
  standalone: true,
  // 👇 Añadido TranslateModule y LangSwitchComponent
  imports: [CommonModule, FormsModule, TranslateModule, LangSwitchComponent],
  templateUrl: './perfil-nutricional.html',
  styleUrl: './perfil-nutricional.css',
})
export class PerfilNutricionalComponent implements OnInit {
  private auth = inject(AuthService);
  private svc = inject(PerfilNutricionalService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService); // Inyectamos el servicio de traducción

  // Estado
  cargando = true;
  guardando = false;
  guardadoOk = false;
  error = '';
  paso = 1; // wizard de 3 pasos
  readonly totalPasos = 3;

  // Opciones
  readonly tiposDieta: TipoDieta[] = [
    'Sin restricción',
    'Vegetariana',
    'Vegana',
    'Keto',
    'Alta en proteína',
    'Baja en azúcar',
  ];

  readonly objetivos: ObjetivoNutricional[] = [
    'Alimentación saludable',
    'Perder peso',
    'Mantener peso',
    'Ganar masa muscular',
    'Mejorar energía',
  ];

  readonly restriccionesOpciones = RESTRICCIONES_OPCIONES;
  readonly alergiasOpciones = ALERGIAS_OPCIONES;

  // Formulario
  perfil: PerfilNutricional = {
    tipoDieta: 'Sin restricción',
    objetivoNutricional: 'Alimentación saludable',
    restriccionesDieteticas: [],
    alergias: [],
    actualizadoEn: '',
    completado: false,
  };

  nombreUsuario = '';
  uid = '';

  async ngOnInit() {
    const usuario = this.auth.usuarioLogueado;
    if (!usuario) {
      this.router.navigate(['/login']);
      return;
    }
    this.uid = usuario.uid;
    this.nombreUsuario = usuario.displayName ?? usuario.email ?? '';

    const existente = await this.svc.getPerfil(this.uid);
    if (existente) {
      this.perfil = { ...existente };
    }
    this.cargando = false;
    this.cdr.detectChanges();
  }

  // --- Paso wizard ---
  siguientePaso() {
    if (this.paso < this.totalPasos) this.paso++;
    this.cdr.detectChanges();
  }

  pasoAnterior() {
    if (this.paso > 1) this.paso--;
    this.cdr.detectChanges();
  }

  // --- Toggle listas ---
  toggleRestriccion(item: string) {
    const idx = this.perfil.restriccionesDieteticas.indexOf(item);
    if (idx >= 0) {
      this.perfil.restriccionesDieteticas.splice(idx, 1);
    } else {
      this.perfil.restriccionesDieteticas.push(item);
    }
  }

  toggleAlergia(item: string) {
    const idx = this.perfil.alergias.indexOf(item);
    if (idx >= 0) {
      this.perfil.alergias.splice(idx, 1);
    } else {
      this.perfil.alergias.push(item);
    }
  }

  tieneRestriccion(item: string): boolean {
    return this.perfil.restriccionesDieteticas.includes(item);
  }

  tieneAlergia(item: string): boolean {
    return this.perfil.alergias.includes(item);
  }

  // --- Guardar ---
  async guardar() {
    this.guardando = true;
    this.error = '';
    try {
      await this.svc.savePerfil(this.uid, this.perfil);
      this.guardadoOk = true;
      setTimeout(() => {
        this.router.navigate(['/menu']);
      }, 1800);
    } catch (e: any) {
      // Usamos el servicio de traducción para el mensaje de error
      this.error =
        this.translate.instant('PERFIL_NUTRICIONAL.ERROR_GUARDAR') ||
        'No se pudo guardar el perfil. Intenta de nuevo.';
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  volver() {
    this.router.navigate(['/menu']);
  }

  get progreso(): number {
    return (this.paso / this.totalPasos) * 100;
  }
}
