import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';

export interface Comunidad {
  id: number;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  latitud?: number | null;
  longitud?: number | null;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ComunidadService {

  private base = environment.API_URL;

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.storageService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  listar(): Observable<Comunidad[]> {
    return this.http.get<Comunidad[]>(
      `${this.base}/comunidades`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  crear(data: Partial<Comunidad>): Observable<any> {
    return this.http.post<any>(
      `${this.base}/comunidades/create`,
      data,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  actualizar(id: number, data: Partial<Comunidad>): Observable<any> {
    return this.http.put<any>(
      `${this.base}/comunidades/${id}/update`,
      data,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.base}/comunidades/${id}/delete`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en ComunidadService:', error);
    return throwError(() => error);
  }
}