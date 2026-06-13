import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { Device, Lectura, LecturaPayload } from '../../core/models/device.model';
import { DeviceService } from '../../core/services/device.service';
import { LecturaService } from '../../core/services/lectura.service';
import { StorageService } from '../../core/services/storage.service';
import { AuthService } from '../../core/services/auth.service';


type TabActiva = 'dispositivos' | 'lecturas';

@Component({
  selector: 'app-dispositivos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dispositivos.html',
  styleUrl: './dispositivos.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dispositivos implements OnInit {

  tabActiva: TabActiva = 'dispositivos';

  //  Dispositivos 
  dispositivos: Device[] = [];
  dispositivosFiltrados: Device[] = [];
  loadingDispositivos = false;
  modalDispositivoVisible = false;
  modoEdicion = false;
  dispositivoSeleccionado: Device | null = null;
  deletingId: number | null = null;
  dispositivoForm: Partial<Device> = this.formInicial();
  searchTerm = '';

  //  Lecturas 
  lecturas: Lectura[] = [];
  lecturasFiltradas: Lectura[] = [];
  loadingLecturas = false;
  filtroFuente = 'TODOS';

  //  Registro manual 
  modalLecturaVisible = false;
  savingLectura = false;
  lecturaForm: LecturaPayload = this.lecturaFormInicial();

  //  Generales 
  saving = false;
  errorMessage = '';
  successMessage = '';
  esAdmin = false;

  constructor(
    private deviceService: DeviceService,
    private lecturaService: LecturaService,
    private storageService: StorageService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.esAdmin = this.authService.isAdmin();
    this.cargarDispositivos();
    this.cargarLecturas();
  }

 
  //   TABS
  
  cambiarTab(tab: TabActiva): void {
    this.tabActiva = tab;
    this.limpiarMensajes();
    this.cdr.markForCheck();
  }

  
  //   DISPOSITIVOS
  
  cargarDispositivos(): void {
    this.loadingDispositivos = true;
    this.cdr.markForCheck();

    this.deviceService.listar()
      .pipe(finalize(() => {
        this.loadingDispositivos = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (data) => {
          this.dispositivos = data ?? [];
          this.aplicarFiltrosDispositivos();
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  aplicarFiltrosDispositivos(): void {
    const termino = this.searchTerm.toLowerCase().trim();
    this.dispositivosFiltrados = this.dispositivos.filter(d => {
      return !termino || [d.nombre, d.mac_address, d.ip_address, d.ubicacion]
        .filter(Boolean).join(' ').toLowerCase().includes(termino);
    });
    this.cdr.markForCheck();
  }

  buscar(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.aplicarFiltrosDispositivos();
  }

  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.dispositivoSeleccionado = null;
    this.dispositivoForm = this.formInicial();
    this.limpiarMensajes();
    this.modalDispositivoVisible = true;
    this.cdr.markForCheck();
  }

  abrirModalEditar(dispositivo: Device): void {
    this.modoEdicion = true;
    this.dispositivoSeleccionado = dispositivo;
    this.dispositivoForm = {
      nombre: dispositivo.nombre,
      mac_address: dispositivo.mac_address || '',
      ip_address: dispositivo.ip_address || '',
      ubicacion: dispositivo.ubicacion || '',
      firmware: dispositivo.firmware || '',
      activo: dispositivo.activo,
      comunidad_id: dispositivo.comunidad_id
    };
    this.limpiarMensajes();
    this.modalDispositivoVisible = true;
    this.cdr.markForCheck();
  }

  cerrarModalDispositivo(): void {
    if (this.saving) return;
    this.modalDispositivoVisible = false;
    this.dispositivoForm = this.formInicial();
    this.limpiarMensajes();
    this.cdr.markForCheck();
  }

  guardarDispositivo(): void {
    this.limpiarMensajes();

    if (!this.dispositivoForm.nombre?.trim()) {
      this.errorMessage = 'El nombre del dispositivo es obligatorio.';
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    const accion = this.modoEdicion && this.dispositivoSeleccionado
      ? this.deviceService.actualizar(this.dispositivoSeleccionado.id, this.dispositivoForm)
      : this.deviceService.crear(this.dispositivoForm);

    accion.pipe(finalize(() => {
      this.saving = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => {
        this.successMessage = this.modoEdicion
          ? 'Dispositivo actualizado correctamente.'
          : 'Dispositivo creado correctamente.';
        this.modalDispositivoVisible = false;
        this.cargarDispositivos();
      },
      error: (error) => {
        this.errorMessage = this.obtenerMensajeError(error);
      }
    });
  }

  eliminarDispositivo(dispositivo: Device): void {
    if (!confirm(`¿Desea eliminar "${dispositivo.nombre}"?`)) return;

    this.deletingId = dispositivo.id;
    this.limpiarMensajes();
    this.cdr.markForCheck();

    this.deviceService.eliminar(dispositivo.id)
      .pipe(finalize(() => {
        this.deletingId = null;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.dispositivos = this.dispositivos.filter(d => d.id !== dispositivo.id);
          this.aplicarFiltrosDispositivos();
          this.successMessage = 'Dispositivo eliminado correctamente.';
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

 formInicial(): Partial<Device> {
    return {
      nombre: '',
      mac_address: '',
      ip_address: '',
      ubicacion: '',
      firmware: '',
      activo: true
    };
  }

  
  //   LECTURAS
  
  cargarLecturas(): void {
    this.loadingLecturas = true;
    this.cdr.markForCheck();

    this.lecturaService.listar()
      .pipe(finalize(() => {
        this.loadingLecturas = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (data) => {
          this.lecturas = data ?? [];
          this.aplicarFiltrosLecturas();
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  aplicarFiltrosLecturas(): void {
    if (this.filtroFuente === 'TODOS') {
      this.lecturasFiltradas = [...this.lecturas];
    } else {
      this.lecturasFiltradas = this.lecturas.filter(l => l.fuente === this.filtroFuente);
    }
    this.cdr.markForCheck();
  }

  cambiarFiltroFuente(fuente: string): void {
    this.filtroFuente = fuente;
    this.aplicarFiltrosLecturas();
  }

  
  //   REGISTRO MANUAL
 
  abrirModalLectura(): void {
    this.lecturaForm = this.lecturaFormInicial();
    this.limpiarMensajes();
    this.modalLecturaVisible = true;
    this.cdr.markForCheck();
  }

  cerrarModalLectura(): void {
    if (this.savingLectura) return;
    this.modalLecturaVisible = false;
    this.limpiarMensajes();
    this.cdr.markForCheck();
  }

  guardarLecturaManual(): void {
    this.limpiarMensajes();

    if (!this.lecturaForm.dispositivo_id || !this.lecturaForm.fecha) {
      this.errorMessage = 'Seleccione un dispositivo y una fecha.';
      this.cdr.markForCheck();
      return;
    }

    this.savingLectura = true;
    this.cdr.markForCheck();

    const usuario = this.storageService.getUsuario();
    const payload: LecturaPayload = {
      ...this.lecturaForm,
      fuente: 'MANUAL',
      registrado_por: usuario?.username || usuario?.nombre || 'admin'
    };

    this.lecturaService.crear(payload)
      .pipe(finalize(() => {
        this.savingLectura = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res) => {
          this.successMessage = `Lectura guardada — Estado: ${res.estado} (${res.nivel})`;
          this.modalLecturaVisible = false;
          this.cargarLecturas();
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  lecturaFormInicial(): LecturaPayload {
    const ahora = new Date();
    const fechaLocal = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);
    return {
      dispositivo_id: this.dispositivos[0]?.id || 1,
      temperatura: 0,
      turbidez: 0,
      conductividad: 0,
      ph: 7.0,
      fecha: fechaLocal,
      fuente: 'MANUAL',
      registrado_por: ''
    };
  }

  
  //   HELPERS
  
  obtenerNombreDispositivo(id: number): string {
    return this.dispositivos.find(d => d.id === id)?.nombre || `Dispositivo ${id}`;
  }

  estadoClass(estado: string): string {
    const e = estado?.toLowerCase();
    if (e === 'agua apta') return 'badge-ok';
    if (e === 'precaucion') return 'badge-warn';
    return 'badge-err';
  }

  nivelClass(nivel: string): string {
    if (nivel === 'VERDE') return 'badge-ok';
    if (nivel === 'AMARILLO') return 'badge-warn';
    return 'badge-err';
  }

  totalActivos(): number {
    return this.dispositivos.filter(d => d.activo).length;
  }

  limpiarMensajes(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  trackById(index: number, item: any): number {
    return item.id;
  }

  private obtenerMensajeError(error: any): string {
    if (error.status === 0) return 'No fue posible conectarse con el servidor.';
    if (error.status === 401) return 'Sesión no válida. Inicie sesión nuevamente.';
    if (error.status === 403) return 'No tiene permisos para realizar esta acción.';
    if (error.status === 404) return 'Recurso no encontrado.';
    if (error.status === 400 && error.error) {
      if (typeof error.error === 'string') return error.error;
      const key = Object.keys(error.error)[0];
      if (key && Array.isArray(error.error[key])) return error.error[key][0];
    }
    return 'Ocurrió un error al procesar la solicitud.';
  }
}