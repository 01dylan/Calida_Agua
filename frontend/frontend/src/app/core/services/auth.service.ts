// src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models/auth-response.model';
import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private apiUrl = environment.API_URL;

    constructor(
        private http: HttpClient,
        private storageService: StorageService
    ) { }

    login(username: string, password: string): Observable<any> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/token/`, {
            username,
            password
        }).pipe(
            tap(response => {
                this.storageService.setToken(response.access);
                if (response.refresh) {
                    this.storageService.setRefreshToken(response.refresh);
                }
            }),
            switchMap(response => {
                const headers = new HttpHeaders({
                    Authorization: `Bearer ${response.access}`
                });
                return this.http.get<any>(`${this.apiUrl}/me/`, { headers });
            }),
            tap(usuario => {
                this.storageService.setUsuario({
                    idusuarios: usuario.id,
                    username: usuario.username,
                    email: usuario.email,
                    nombre: usuario.username,
                    estado: 'ACTIVO',
                    is_staff: usuario.is_staff
                });
            })
        );
    }

    logout(): void {
        this.storageService.clear();
    }

    isAuthenticated(): boolean {
        return this.storageService.isAuthenticated();
    }

    isAdmin(): boolean {
        const usuario = this.storageService.getUsuario();
        return (usuario as any)?.is_staff === true;
    }

    isOperador(): boolean {
        const usuario = this.storageService.getUsuario();
        return (usuario as any)?.is_staff === false;
    }
}