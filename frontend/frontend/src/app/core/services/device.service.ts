// src/app/core/services/device.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, throwError, shareReplay } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { Device, PaginatedDeviceResponse } from '../models/device.model';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  private apiUrl = `${environment.API_URL}/devices/`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Device[]> {
    return this.http.get<PaginatedDeviceResponse | Device[]>(this.apiUrl).pipe(
      map((response) => this.normalizarRespuesta(response)),
      shareReplay(1),
      catchError(this.handleError)
    );
  }

  obtenerPorId(id: number): Observable<Device> {
    return this.http.get<Device>(`${this.apiUrl}${id}/`).pipe(
      catchError(this.handleError)
    );
  }

  crear(device: Partial<Device>): Observable<Device> {
    return this.http.post<Device>(this.apiUrl, device).pipe(
      catchError(this.handleError)
    );
  }

  actualizar(id: number, device: Partial<Device>): Observable<Device> {
    return this.http.put<Device>(`${this.apiUrl}${id}/`, device).pipe(
      catchError(this.handleError)
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`).pipe(
      catchError(this.handleError)
    );
  }

  private normalizarRespuesta(response: PaginatedDeviceResponse | Device[]): Device[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (response && Array.isArray(response.results)) {
      return response.results;
    }

    return [];
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en DeviceService:', error);
    return throwError(() => error);
  }
}