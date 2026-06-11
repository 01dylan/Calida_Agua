// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

import { LoginComponent } from './pages/login/login.component';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./features/home/home')
                .then(m => m.Home),
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'admin',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: 'dashboard',
                component: DashboardComponent,
                canActivate: [authGuard]
            },
            {
                path: 'comunidades',
                loadComponent: () =>
                    import('./features/comunidades/comunidades')
                        .then(m => m.Comunidades),
                canActivate: [authGuard]
            },
            {
                path: 'dispositivos',
                loadComponent: () =>
                    import('./features/dispositivos/dispositivos')
                        .then(m => m.Dispositivos),
                canActivate: [authGuard]
            },
            {
                path: 'monitoreo',
                loadComponent: () =>
                    import('./features/monitoreo/monitoreo')
                        .then(m => m.MonitoreoComponent),
                canActivate: [authGuard]
            },
            {
                path: 'roles',
                loadComponent: () =>
                    import('./features/roles/roles')
                        .then(m => m.RolesComponent),
                canActivate: [authGuard]
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];