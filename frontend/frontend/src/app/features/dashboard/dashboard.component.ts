import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef,
  ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';

import { StorageService } from '../../core/services/storage.service';
import { DeviceService } from '../../core/services/device.service';
import { LecturaService } from '../../core/services/lectura.service';
import { ComunidadService, Comunidad } from '../../core/services/comunidad.service';
import { Usuario } from '../../core/models/usuario.model';
import { Device, Lectura } from '../../core/models/device.model';

Chart.register(...registerables);

type TabDashboard = 'inicio' | 'graficas' | 'resumen';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('chartPh') chartPhRef!: ElementRef;
  @ViewChild('chartTemp') chartTempRef!: ElementRef;
  @ViewChild('chartTurbidez') chartTurbidezRef!: ElementRef;
  @ViewChild('chartConductividad') chartConductividadRef!: ElementRef;

  tabActiva: TabDashboard = 'inicio';

  usuario: Usuario | null = null;
  dispositivos: Device[] = [];
  lecturas: Lectura[] = [];
  comunidades: Comunidad[] = [];
  loading = true;
  fechaHoy = new Date();
  ultimaActualizacion: Date | null = null;   // <-- para mostrar en pantalla

  private charts: Chart[] = [];
  private pollingInterval: any = null;
  private readonly INTERVALO_MS = 5000;      // <-- refresca cada 5 segundos

  constructor(
    private storageService: StorageService,
    private deviceService: DeviceService,
    private lecturaService: LecturaService,
    private comunidadService: ComunidadService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuario = this.storageService.getUsuario();
    this.cargarDatosEstaticos();   // dispositivos y comunidades solo 1 vez
    this.cargarLecturas();         // primera carga inmediata
    this.iniciarPolling();         // luego cada 5s
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.detenerPolling();         // limpia el intervalo al salir del componente
  }

  // ── Polling ──────────────────────────────────────────

  private iniciarPolling(): void {
    this.pollingInterval = setInterval(() => {
      this.cargarLecturas();
    }, this.INTERVALO_MS);
  }

  private detenerPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // ── Carga de datos ────────────────────────────────────

  cargarDatosEstaticos(): void {
    this.deviceService.listar().subscribe({
      next: (data) => {
        this.dispositivos = data ?? [];
        this.cdr.markForCheck();
      }
    });

    this.comunidadService.listar().subscribe({
      next: (data) => {
        this.comunidades = data ?? [];
        this.cdr.markForCheck();
      }
    });
  }

  cargarLecturas(): void {
    this.lecturaService.listar(undefined, undefined, 50).subscribe({
      next: (data) => {
        this.lecturas = data ?? [];
        this.ultimaActualizacion = new Date();
        this.loading = false;

        // Si las gráficas están visibles, las actualiza también
        if (this.tabActiva === 'graficas') {
          setTimeout(() => this.construirGraficas(), 100);
        }

        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Tabs ──────────────────────────────────────────────

  cambiarTab(tab: TabDashboard): void {
    this.tabActiva = tab;
    this.cdr.markForCheck();
    if (tab === 'graficas') {
      setTimeout(() => this.construirGraficas(), 150);
    }
  }

  // ── Gráficas ──────────────────────────────────────────

  construirGraficas(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    const lecturasOrdenadas = [...this.lecturas].reverse();
    const labels = lecturasOrdenadas.map(l =>
      new Date(l.fecha).toLocaleString('es-CO', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    );

    const config = (label: string, data: number[], color: string) => ({
      type: 'line' as const,
      data: {
        labels,
        datasets: [{
          label,
          data,
          borderColor: color,
          backgroundColor: color + '20',
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index' as const, intersect: false }
        },
        scales: {
          x: {
            ticks: { maxTicksLimit: 8, font: { size: 11 }, color: '#94a3b8' },
            grid: { color: '#f1f5f9' }
          },
          y: {
            ticks: { font: { size: 11 }, color: '#94a3b8' },
            grid: { color: '#f1f5f9' }
          }
        }
      }
    });

    if (this.chartPhRef)
      this.charts.push(new Chart(this.chartPhRef.nativeElement,
        config('pH', lecturasOrdenadas.map(l => l.ph), '#0F6E56')));

    if (this.chartTempRef)
      this.charts.push(new Chart(this.chartTempRef.nativeElement,
        config('Temperatura °C', lecturasOrdenadas.map(l => l.temperatura), '#2563eb')));

    if (this.chartTurbidezRef)
      this.charts.push(new Chart(this.chartTurbidezRef.nativeElement,
        config('Turbidez NTU', lecturasOrdenadas.map(l => l.turbidez), '#d97706')));

    if (this.chartConductividadRef)
      this.charts.push(new Chart(this.chartConductividadRef.nativeElement,
        config('Conductividad µS', lecturasOrdenadas.map(l => l.conductividad), '#7c3aed')));
  }

  // ── Getters ───────────────────────────────────────────

  get totalDispositivos(): number { return this.dispositivos.length; }
  get dispositivosActivos(): number { return this.dispositivos.filter(d => d.activo).length; }
  get totalLecturas(): number { return this.lecturas.length; }
  get alertasHoy(): number {
    return this.lecturas.filter(l =>
      l.estado === 'ADVERTENCIA' || l.estado === 'PRECAUCION'
    ).length;
  }
  get ultimaLectura(): Lectura | null {
    return this.lecturas.length > 0 ? this.lecturas[0] : null;
  }
  get estadoGeneral(): string {
    if (this.lecturas.some(l => l.estado === 'ADVERTENCIA')) return 'ROJO';
    if (this.lecturas.some(l => l.estado === 'PRECAUCION'))  return 'AMARILLO';
    return 'VERDE';
  }

  dispositivosDe(comunidadId: number): Device[] {
    return this.dispositivos.filter(d => d.comunidad_id === comunidadId);
  }

  lecturasDeDispositivo(dispositivoId: number): Lectura | null {
    return this.lecturas.find(l => l.dispositivo_id === dispositivoId) || null;
  }

  estadoClass(estado: string): string {
    if (estado === 'ADVERTENCIA') return 'badge-err';
    if (estado === 'PRECAUCION')  return 'badge-warn';
    return 'badge-ok';
  }

  tiempoTranscurrido(fecha: string): string {
    const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 1000);
    if (diff < 60)    return `hace ${diff}s`;
    if (diff < 3600)  return `hace ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return `hace ${Math.floor(diff / 86400)}d`;
  }
}