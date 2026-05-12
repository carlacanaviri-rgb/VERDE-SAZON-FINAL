import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { Mensaje } from '../../models/mensaje.model';
import { Pedido } from '../../models/pedido.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-chat-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './chat-modal.html',
  styleUrls: ['./chat-modal.css'],
})
export class ChatModalComponent implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('mensajesScroll') mensajesScroll?: ElementRef;

  pedido?: Pedido;
  isOpen = false;
  mensajes: Mensaje[] = [];
  nuevoMensaje = '';
  enviando = false;
  usuarioActualId = '';
  usuarioActualNombre = '';
  usuarioActualRol: 'cocina' | 'cliente' = 'cocina';

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.obtenerUsuarioActual();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.pedido?.id) {
      this.chatService.limpiarSuscripcion(this.pedido.id);
    }
  }

  private obtenerUsuarioActual() {
    this.authService.usuario$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((user) => {
      if (user) {
        this.usuarioActualId = user.uid;
        this.usuarioActualNombre = user.displayName || user.email || 'Usuario';
      }
    });
  }

  /**
   * Abre el modal de chat para un pedido específico
   */
  abrir(pedido: Pedido, rol: 'cocina' | 'cliente' = 'cocina') {
    this.pedido = pedido;
    this.usuarioActualRol = rol;
    this.isOpen = true;
    this.mensajes = [];
    this.nuevoMensaje = '';

    // Cargar mensajes del pedido
    if (pedido.id) {
      this.chatService
        .getMensajes(pedido.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((mensajes) => {
          this.mensajes = mensajes;
          this.cdr.detectChanges();
          this.scrollAlFinal();
        });
    }
  }

  /**
   * Cierra el modal de chat
   */
  cerrar() {
    this.isOpen = false;
    if (this.pedido?.id) {
      this.chatService.limpiarSuscripcion(this.pedido.id);
    }
    this.pedido = undefined;
    this.mensajes = [];
  }

  /**
   * Envía un nuevo mensaje
   */
  async enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.pedido?.id || this.enviando) {
      return;
    }

    this.enviando = true;

    try {
      await this.chatService.enviarMensaje({
        pedidoId: this.pedido.id,
        autorId: this.usuarioActualId,
        autorNombre: this.usuarioActualNombre,
        rol: this.usuarioActualRol,
        contenido: this.nuevoMensaje,
      });

      this.nuevoMensaje = '';
      this.cdr.detectChanges();
      this.scrollAlFinal();
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      alert('Error al enviar el mensaje. Intenta nuevamente.');
    } finally {
      this.enviando = false;
    }
  }

  /**
   * Verifica si un mensaje fue enviado por el usuario actual
   */
  esDelUsuarioActual(mensaje: Mensaje): boolean {
    return mensaje.autorId === this.usuarioActualId;
  }

  /**
   * Obtiene la clase CSS para el contenedor del mensaje
   */
  getClaseMensaje(mensaje: Mensaje): string {
    return this.esDelUsuarioActual(mensaje) ? 'mensaje-propio' : 'mensaje-otro';
  }

  /**
   * Maneja la tecla Enter para enviar el mensaje
   */
  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }

  /**
   * Desplaza el scroll al final de los mensajes
   */
  private scrollAlFinal() {
    setTimeout(() => {
      if (this.mensajesScroll) {
        this.mensajesScroll.nativeElement.scrollTop =
          this.mensajesScroll.nativeElement.scrollHeight;
      }
    }, 100);
  }
}


