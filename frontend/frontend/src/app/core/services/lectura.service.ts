// src/app/core/services/lectura.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { Lectura, LecturaPayload } from '../models/device.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class LecturaService {

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

  listar(dispositivoId?: number, fuente?: string, limit = 50): Observable<Lectura[]> {
    let url = `${this.base}/lecturas?limit=${limit}`;
    if (dispositivoId) url += `&dispositivo_id=${dispositivoId}`;
    if (fuente) url += `&fuente=${fuente}`;
    return this.http.get<Lectura[]>(url, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  ultima(dispositivoId: number): Observable<Lectura> {
    return this.http.get<Lectura>(
      `${this.base}/lecturas/latest?dispositivo_id=${dispositivoId}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  crear(payload: LecturaPayload): Observable<any> {
    return this.http.post<any>(
      `${this.base}/lecturas/create`,
      payload,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.base}/lecturas/${id}/delete`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en LecturaService:', error);
    return throwError(() => error);
  }
}