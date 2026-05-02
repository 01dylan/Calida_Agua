import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';

export interface DjangoUsuario {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined?: string;
}

export interface CreateUsuarioPayload {
  username: string;
  password: string;
  email?: string;
  nombre?: string;
  apellido?: string;
  is_staff: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

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

  listar(): Observable<DjangoUsuario[]> {
    return this.http.get<DjangoUsuario[]>(
      `${this.base}/users`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  crear(data: CreateUsuarioPayload): Observable<any> {
    return this.http.post<any>(
      `${this.base}/users/create`,
      data,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  actualizar(id: number, data: Partial<CreateUsuarioPayload>): Observable<any> {
    return this.http.put<any>(
      `${this.base}/users/${id}/update`,
      data,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.base}/users/${id}/delete`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en UserService:', error);
    return throwError(() => error);
  }
}