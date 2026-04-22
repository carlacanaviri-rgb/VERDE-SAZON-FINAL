import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ClientePerfil } from '../models/cliente-perfil.model';
import { ClienteRanking } from '../models/cliente-ranking.model';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private http = inject(HttpClient);

  getPerfil(clienteId: string): Observable<ClientePerfil> {
    return this.http.get<ClientePerfil>(`${API}/clientes/${clienteId}/perfil`).pipe(
      catchError(() => of({
        clienteId,
        clasificacion: 'Nuevo' as const,
        pedidosCompletados: 0,
        montoTotalCompletado: 0
      }))
    );
  }

  getRankingTop(limit = 10): Observable<ClienteRanking[]> {
    return this.http.get<ClienteRanking[]>(`${API}/clientes/ranking`, {
      params: { limit }
    }).pipe(
      catchError(() => of([]))
    );
  }
}

