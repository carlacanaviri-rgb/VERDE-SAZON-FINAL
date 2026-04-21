import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ClientePerfil } from '../models/cliente-perfil.model';
import { ClienteRanking } from '../models/cliente-ranking.model';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private http = inject(HttpClient);

  getPerfil(clienteId: string): Observable<ClientePerfil> {
    return this.http.get<ClientePerfil>(`${API}/clientes/${clienteId}/perfil`);
  }

  getRankingTop(limit = 10): Observable<ClienteRanking[]> {
    return this.http.get<ClienteRanking[]>(`${API}/clientes/ranking`, {
      params: { limit }
    });
  }
}

