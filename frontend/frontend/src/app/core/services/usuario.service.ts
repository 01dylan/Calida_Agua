import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { Usuario, PaginatedUsuarioResponse } from '../models/usuario.model';
import { AuthHeadersService } from './auth-headers.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = `${environment.API_URL}/usuarios/`;

  constructor(
    private http: HttpClient,
    private authHeaders: AuthHeadersService
  ) {}

  listar(): Observable<Usuario[]> {
    return this.http.get<PaginatedUsuarioResponse | Usuario[]>(
      this.apiUrl,
      { headers: this.authHeaders.getAuthHeaders() }
    ).pipe(
      map(response => Array.isArray(response) ? response : response.results),
      catchError(this.handleError)
    );
  }

  crear(usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.post<Usuario>(
      this.apiUrl,
      usuario,
      { headers: this.authHeaders.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  actualizar(id: number, usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(
      `${this.apiUrl}${id}/`,
      usuario,
      { headers: this.authHeaders.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}${id}/`,
      { headers: this.authHeaders.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en UsuarioService:', error);
    return throwError(() => error);
  }
}