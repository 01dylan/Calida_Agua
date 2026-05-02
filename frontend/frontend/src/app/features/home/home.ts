import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import * as L from 'leaflet';

import { ComunidadService, Comunidad } from '../../core/services/comunidad.service';
import { DeviceService } from '../../core/services/device.service';
import { LecturaService } from '../../core/services/lectura.service';
import { Device, Lectura } from '../../core/models/device.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home implements OnInit, AfterViewInit, OnDestroy {

  comunidades: Comunidad[] = [];
  dispositivos: Device[] = [];
  lecturas: Lectura[] = [];
  loading = true;

  private map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private intervalo: any;

  constructor(
    private comunidadService: ComunidadService,
    private deviceService: DeviceService,
    private lecturaService: LecturaService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
    this.intervalo = setInterval(() => this.cargarLecturas(), 30000);
  }

  ngAfterViewInit(): void {
    this.iniciarMapa();
  }

  ngOnDestroy(): void {
    if (this.intervalo) clearInterval(this.intervalo);
    if (this.map) this.map.remove();
  }

  cargarDatos(): void {
    this.comunidadService.listar().subscribe({
      next: (data) => {
        this.comunidades = data ?? [];
        this.cdr.markForCheck();
        this.colocarMarcadores();
      }
    });

    this.deviceService.listar().subscribe({
      next: (data) => {
        this.dispositivos = data ?? [];
        this.cdr.markForCheck();
      }
    });

    this.cargarLecturas();
  }

  cargarLecturas(): void {
    this.lecturaService.listar(undefined, undefined, 20).subscribe({
      next: (data) => {
        this.lecturas = data ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  iniciarMapa(): void {
    const defaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
    L.Marker.prototype.options.icon = defaultIcon;

    this.map = L.map('mapa-home', {
      center: [4.5709, -74.2973],
      zoom: 5,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.colocarMarcadores();
  }

  async colocarMarcadores(): Promise<void> {
    if (!this.map) return;

    this.markers.forEach(m => m.remove());
    this.markers = [];

    for (const c of this.comunidades) {
      let lat = c.latitud;
      let lng = c.longitud;

      if (!lat || !lng) {
        const coords = await this.geocodificar(c);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }
      }

      if (lat && lng) {
        const dispositivos = this.dispositivosDeComunidad(c.id).length;
        const marker = L.marker([lat, lng])
          .addTo(this.map!)
          .bindPopup(`
            <div style="min-width:160px">
              <strong style="font-size:14px">${c.nombre}</strong><br>
              <span style="color:#64748b;font-size:12px">
                ${c.municipio || ''}${c.departamento ? ', ' + c.departamento : ''}${c.pais ? ', ' + c.pais : ''}
              </span><br>
              <span style="font-size:12px;margin-top:4px;display:block">
                📡 ${dispositivos} dispositivo(s)
              </span>
            </div>
          `);
        this.markers.push(marker);
      }
    }

    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.3));
    }
  }

  async geocodificar(comunidad: Comunidad): Promise<{lat: number, lng: number} | null> {
    try {
      const query = [
        comunidad.municipio,
        comunidad.departamento,
        comunidad.pais || 'Colombia'
      ].filter(Boolean).join(', ');

      if (!query.trim()) return null;

      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
      const response = await fetch(url, {
        headers: { 'Accept-Language': 'es' }
      });
      const data = await response.json();

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  dispositivosDeComunidad(comunidadId: number): Device[] {
    return this.dispositivos.filter(d => d.comunidad_id === comunidadId);
  }

  dispositivosDe(comunidadId: number): number {
    return this.dispositivosDeComunidad(comunidadId).length;
  }

  ultimaLecturaDe(dispositivoId: number): Lectura | null {
    return this.lecturas.find(l => l.dispositivo_id === dispositivoId) || null;
  }

  estadoClass(estado: string): string {
    if (estado === 'ADVERTENCIA') return 'badge-err';
    if (estado === 'PRECAUCION') return 'badge-warn';
    return 'badge-ok';
  }

  get alertasActivas(): number {
    return this.lecturas.filter(l =>
      l.estado === 'ADVERTENCIA' || l.estado === 'PRECAUCION'
    ).length;
  }

  get estadoGeneral(): string {
    if (this.lecturas.some(l => l.estado === 'ADVERTENCIA')) return 'ROJO';
    if (this.lecturas.some(l => l.estado === 'PRECAUCION')) return 'AMARILLO';
    return 'VERDE';
  }

  irLogin(): void {
    this.router.navigate(['/login']);
  }

  trackById(index: number, item: any): number {
    return item.id;
  }
}