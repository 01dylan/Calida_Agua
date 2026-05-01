// src/app/core/services/menu.service.ts

import { Injectable } from '@angular/core';

export interface MenuItem {
  id: number;
  nombre: string;
  path: string;
  icono?: string;
  orden: number;
  padre: number | null;
  estado: string;
  items: MenuItem[];
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  private menuFijo: MenuItem[] = [
    {
      id: 1,
      nombre: 'Panel Principal',
      path: '/dashboard',
      icono: 'fa-solid fa-gauge',
      orden: 1,
      padre: null,
      estado: 'activo',
      items: []
    },
    {
      id: 2,
      nombre: 'Comunidades',
      path: '/comunidades',
      icono: 'fa-solid fa-location-dot',
      orden: 2,
      padre: null,
      estado: 'activo',
      items: []
    },
    {
      id: 3,
      nombre: 'Dispositivos y lecturas',
      path: '/dispositivos',
      icono: 'fa-solid fa-microchip',
      orden: 3,
      padre: null,
      estado: 'activo',
      items: []
    },
    {
      id: 4,
      nombre: 'Monitoreo ESP32',
      path: '/monitoreo',
      icono: 'fa-solid fa-droplet',
      orden: 4,
      padre: null,
      estado: 'activo',
      items: []
    },
    {
      id: 5,
      nombre: 'Roles y permisos',
      path: '/roles',
      icono: 'fa-solid fa-user-shield',
      orden: 5,
      padre: null,
      estado: 'activo',
      items: []
    }
  ];

  getMenu(): MenuItem[] {
    return this.menuFijo;
  }

  hasAccess(path: string): boolean {
    return true;
  }
}