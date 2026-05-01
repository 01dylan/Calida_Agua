// src/app/core/services/menu.service.ts

import { Injectable } from '@angular/core';
import { Recurso } from '../models/recurso.model';
import { StorageService } from './storage.service';

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

  constructor(private storageService: StorageService) {}

  getMenu(): MenuItem[] {
    const recursos = this.storageService
      .getRecursos()
      .filter(recurso => this.estaActivo(recurso.estado))
      .sort((a, b) => a.orden - b.orden);

    return this.construirArbol(recursos);
  }

  private construirArbol(recursos: Recurso[]): MenuItem[] {
    const mapa = new Map<number, MenuItem>();
    const raiz: MenuItem[] = [];

    recursos.forEach(recurso => {
      mapa.set(recurso.idRecursos, {
        id: recurso.idRecursos,
        nombre: recurso.nombre,
        path: this.normalizarRutaFrontend(recurso.url_frontend || recurso.path || '#'),
        icono: recurso.icono || 'fa-solid fa-circle',
        orden: recurso.orden,
        padre: recurso.recurso_padre || null,
        estado: recurso.estado,
        items: []
      });
    });

    mapa.forEach(item => {
      if (item.padre) {
        const padre = mapa.get(item.padre);

        if (padre) {
          padre.items.push(item);
        }
      } else {
        raiz.push(item);
      }
    });

    raiz.sort((a, b) => a.orden - b.orden);

    raiz.forEach(item => {
      item.items.sort((a, b) => a.orden - b.orden);
    });

    return raiz;
  }

  hasAccess(path: string): boolean {
    const rutaNormalizada = this.normalizarRutaFrontend(path);

    const recursos = this.storageService
      .getRecursos()
      .filter(recurso => this.estaActivo(recurso.estado));

    return recursos.some(recurso => {
      const rutaFrontend = this.normalizarRutaFrontend(
        recurso.url_frontend || recurso.path || ''
      );

      return rutaFrontend === rutaNormalizada;
    });
  }

  private estaActivo(estado: string): boolean {
    return estado?.toLowerCase() === 'activo' || estado === '1';
  }

  private normalizarRutaFrontend(ruta: string): string {
    if (!ruta || ruta === '#') {
      return '#';
    }

    let rutaNormalizada = ruta.trim();

    if (!rutaNormalizada.startsWith('/')) {
      rutaNormalizada = `/${rutaNormalizada}`;
    }

    if (rutaNormalizada.length > 1 && rutaNormalizada.endsWith('/')) {
      rutaNormalizada = rutaNormalizada.slice(0, -1);
    }

    return rutaNormalizada;
  }
}