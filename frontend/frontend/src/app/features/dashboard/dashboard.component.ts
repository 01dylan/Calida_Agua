import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';
import { DeviceService } from '../../core/services/device.service';
import { LecturaService } from '../../core/services/lectura.service';
import { Usuario } from '../../core/models/usuario.model';
import { Device, Lectura } from '../../core/models/device.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {

  usuario: Usuario | null = null;
  dispositivos: Device[] = [];
  lecturas: Lectura[] = [];
  loading = true;
  fechaHoy = new Date();

  constructor(
    private storageService: StorageService,
    private deviceService: DeviceService,
    private lecturaService: LecturaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuario = this.storageService.getUsuario();
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.deviceService.listar().subscribe({
      next: (data) => {
        this.dispositivos = data ?? [];
        this.cdr.markForCheck();
      }
    });

    this.lecturaService.listar(undefined, undefined, 10).subscribe({
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

  get totalDispositivos(): number {
    return this.dispositivos.length;
  }

  get dispositivosActivos(): number {
    return this.dispositivos.filter(d => d.activo).length;
  }

  get totalLecturas(): number {
    return this.lecturas.length;
  }

  get alertasHoy(): number {
    return this.lecturas.filter(l =>
      l.estado === 'ADVERTENCIA' || l.estado === 'PRECAUCION'
    ).length;
  }

  get ultimaLectura(): Lectura | null {
    return this.lecturas.length > 0 ? this.lecturas[0] : null;
  }

  get estadoGeneral(): string {
    const peligro = this.lecturas.some(l => l.estado === 'ADVERTENCIA');
    const precaucion = this.lecturas.some(l => l.estado === 'PRECAUCION');
    if (peligro) return 'ROJO';
    if (precaucion) return 'AMARILLO';
    return 'VERDE';
  }

  estadoClass(estado: string): string {
    if (estado === 'ADVERTENCIA') return 'badge-err';
    if (estado === 'PRECAUCION') return 'badge-warn';
    return 'badge-ok';
  }

  tiempoTranscurrido(fecha: string): string {
    const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 1000);
    if (diff < 60) return `hace ${diff}s`;
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return `hace ${Math.floor(diff / 86400)}d`;
  }
}