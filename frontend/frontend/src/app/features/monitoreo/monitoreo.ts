import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
  ElementRef, ViewChildren, QueryList
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

import { LecturaService } from '../../core/services/lectura.service';
import { DeviceService } from '../../core/services/device.service';
import { Device, Lectura } from '../../core/models/device.model';

Chart.register(...registerables);

@Component({
  selector: 'app-monitoreo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './monitoreo.html',
  styleUrl: './monitoreo.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonitoreoComponent implements OnInit, OnDestroy {

  @ViewChildren('chartCanvas') chartCanvases!: QueryList<ElementRef>;

  dispositivos: Device[] = [];
  lecturasPorDispositivo: { [id: number]: Lectura[] } = {};
  ultimaLectura: { [id: number]: Lectura | null } = {};
  ultimaActualizacion: Date | null = null;
  loading = true;

  private charts: { [key: string]: Chart } = {};
  private pollingInterval: any = null;
  private readonly INTERVALO_MS = 5000;

  readonly sensores = [
    { key: 'temperatura',   label: 'Temperatura',   unidad: '°C',  color: '#2563eb' },
    { key: 'ph',            label: 'pH',             unidad: '',    color: '#0F6E56' },
    { key: 'turbidez',      label: 'Turbidez',       unidad: 'NTU', color: '#d97706' },
    { key: 'conductividad', label: 'Conductividad',  unidad: 'µS',  color: '#7c3aed' },
  ];

  constructor(
    private lecturaService: LecturaService,
    private deviceService: DeviceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.deviceService.listar().subscribe({
      next: (data) => {
        this.dispositivos = data ?? [];
        this.cargarLecturas();
        this.iniciarPolling();
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.detenerPolling();
    Object.values(this.charts).forEach(c => c.destroy());
  }

  private iniciarPolling(): void {
    this.pollingInterval = setInterval(() => this.cargarLecturas(), this.INTERVALO_MS);
  }

  private detenerPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  cargarLecturas(): void {
    this.dispositivos.forEach(d => {
      this.lecturaService.listar(d.id, undefined, 20).subscribe({
        next: (data) => {
          this.lecturasPorDispositivo[d.id] = data ?? [];
          this.ultimaLectura[d.id] = data?.length > 0 ? data[0] : null;
          this.ultimaActualizacion = new Date();
          this.loading = false;
          this.cdr.markForCheck();
          setTimeout(() => this.construirGraficas(d.id), 100);
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
    });
  }

  construirGraficas(dispositivoId: number): void {
    const lecturas = [...(this.lecturasPorDispositivo[dispositivoId] ?? [])].reverse();
    const labels = lecturas.map(l =>
      new Date(l.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );

    this.sensores.forEach(sensor => {
      const canvasId = `chart-${dispositivoId}-${sensor.key}`;
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!canvas) return;

      if (this.charts[canvasId]) {
        this.charts[canvasId].destroy();
      }

      this.charts[canvasId] = new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: `${sensor.label} ${sensor.unidad}`,
            data: lecturas.map(l => (l as any)[sensor.key]),
            borderColor: sensor.color,
            backgroundColor: sensor.color + '20',
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
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            x: {
              ticks: { maxTicksLimit: 6, font: { size: 10 }, color: '#94a3b8' },
              grid: { color: '#f1f5f9' }
            },
            y: {
              ticks: { font: { size: 10 }, color: '#94a3b8' },
              grid: { color: '#f1f5f9' }
            }
          }
        }
      });
    });
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
  // Agrega este método para obtener comunidad del dispositivo
  getValorSensor(lectura: Lectura, key: string): string {
  const val = (lectura as any)[key];
  if (val === undefined || val === null) return '—';
  return Number(val).toFixed(1);
}

getComunidad(dispositivo: Device): string {
  return (dispositivo as any).comunidad_nombre ||
         `Comunidad #${(dispositivo as any).comunidad_id}` ||
         'Sin comunidad';
}

}