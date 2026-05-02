import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export interface MenuItem {
  id: number;
  nombre: string;
  path: string;
  icono?: string;
  orden: number;
  padre: number | null;
  estado: string;
  items: MenuItem[];
  soloAdmin?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  private menuFijo: MenuItem[] = [
    {
      id: 1,
      nombre: 'Panel Principal',
      path: '/admin/dashboard',
      icono: 'fa-solid fa-gauge',
      orden: 1,
      padre: null,
      estado: 'activo',
      items: []
    },
    {
      id: 2,
      nombre: 'Comunidades',
      path: '/admin/comunidades',
      icono: 'fa-solid fa-location-dot',
      orden: 2,
      padre: null,
      estado: 'activo',
      items: []
    },
    {
      id: 3,
      nombre: 'Dispositivos y lecturas',
      path: '/admin/dispositivos',
      icono: 'fa-solid fa-microchip',
      orden: 3,
      padre: null,
      estado: 'activo',
      items: []
    },
    {
      id: 4,
      nombre: 'Monitoreo ESP32',
      path: '/admin/monitoreo',
      icono: 'fa-solid fa-droplet',
      orden: 4,
      padre: null,
      estado: 'activo',
      items: []
    },
    {
      id: 5,
      nombre: 'Roles y permisos',
      path: '/admin/roles',
      icono: 'fa-solid fa-user-shield',
      orden: 5,
      padre: null,
      estado: 'activo',
      items: [],
      soloAdmin: true
    }
  ];

  constructor(private authService: AuthService) {}

  getMenu(): MenuItem[] {
    const esAdmin = this.authService.isAdmin();
    return this.menuFijo.filter(item => !item.soloAdmin || esAdmin);
  }

  hasAccess(path: string): boolean {
    return true;
  }
}