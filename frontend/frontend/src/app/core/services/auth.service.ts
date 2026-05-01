// src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

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

    login(username: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login/`, {
            username,
            password
        }).pipe(
            tap(response => {
                this.storageService.setToken(response.access);

                if (response.refresh) {
                    this.storageService.setRefreshToken(response.refresh);
                }

                this.storageService.setUsuario(response.usuario);
                this.storageService.setRoles(response.roles);
                this.storageService.setRecursos(response.recursos);
            })
        );
    }

    logout(): void {
        this.storageService.clear();
    }

    isAuthenticated(): boolean {
        return this.storageService.isAuthenticated();
    }
}