import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { Device } from '../../core/models/device.model';
import { DeviceService } from '../../core/services/device.service';

type ViewMode = 'grid' | 'table';

@Component({
  selector: 'app-dispositivos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dispositivos.html',
  styleUrl: './dispositivos.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dispositivos implements OnInit {

  dispositivos: Device[] = [];
  dispositivosFiltrados: Device[] = [];

  loading = false;
  refreshing = false;
  saving = false;
  deletingId: number | null = null;

  errorMessage = '';
  successMessage = '';

  searchTerm = '';
  filtroEstado = 'TODOS';
  filtroTipo = 'TODOS';
  viewMode: ViewMode = 'grid';

  modalVisible = false;
  modoEdicion = false;

  dispositivoSeleccionado: Device | null = null;

  dispositivoForm: Partial<Device> = this.obtenerFormularioInicial();

  constructor(
    private deviceService: DeviceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDispositivos(true);
  }

  cargarDispositivos(primeraCarga = false): void {
    this.errorMessage = '';

    if (primeraCarga) {
      this.loading = true;
    } else {
      this.refreshing = true;
    }

    this.cdr.markForCheck();

    this.deviceService.listar()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.refreshing = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data) => {
          this.dispositivos = data ?? [];
          this.aplicarFiltros();
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  aplicarFiltros(): void {
    const termino = this.searchTerm.toLowerCase().trim();

    this.dispositivosFiltrados = this.dispositivos.filter(dispositivo => {
      const coincideBusqueda = !termino || [
        dispositivo.name,
        dispositivo.device_id,
        dispositivo.device_type,
        dispositivo.status,
        dispositivo.zone_name,
        dispositivo.farm_name,
        dispositivo.ip_address,
        dispositivo.mac_address,
        dispositivo.firmware_version
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(termino);

      const coincideEstado =
        this.filtroEstado === 'TODOS' ||
        this.normalizarTexto(dispositivo.status) === this.normalizarTexto(this.filtroEstado);

      const coincideTipo =
        this.filtroTipo === 'TODOS' ||
        this.normalizarTexto(dispositivo.device_type) === this.normalizarTexto(this.filtroTipo);

      return coincideBusqueda && coincideEstado && coincideTipo;
    });

    this.cdr.markForCheck();
  }

  buscar(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.aplicarFiltros();
  }

  cambiarFiltroEstado(estado: string): void {
    this.filtroEstado = estado;
    this.aplicarFiltros();
  }

  cambiarFiltroTipo(tipo: string): void {
    this.filtroTipo = tipo;
    this.aplicarFiltros();
  }

  cambiarVista(modo: ViewMode): void {
    this.viewMode = modo;
    this.cdr.markForCheck();
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroEstado = 'TODOS';
    this.filtroTipo = 'TODOS';
    this.aplicarFiltros();
  }

  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.dispositivoSeleccionado = null;
    this.dispositivoForm = this.obtenerFormularioInicial();
    this.errorMessage = '';
    this.successMessage = '';
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  abrirModalEditar(dispositivo: Device): void {
    this.modoEdicion = true;
    this.dispositivoSeleccionado = dispositivo;

    this.dispositivoForm = {
      device_id: dispositivo.device_id,
      name: dispositivo.name,
      device_type: dispositivo.device_type,
      firmware_version: dispositivo.firmware_version || '',
      ip_address: dispositivo.ip_address || '',
      mac_address: dispositivo.mac_address || '',
      status: dispositivo.status || 'ONLINE',
      active: dispositivo.active,
      zone: dispositivo.zone
    };

    this.errorMessage = '';
    this.successMessage = '';
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  cerrarModal(): void {
    if (this.saving) {
      return;
    }

    this.modalVisible = false;
    this.dispositivoSeleccionado = null;
    this.dispositivoForm = this.obtenerFormularioInicial();
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  guardarDispositivo(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.formularioValido()) {
      this.errorMessage = 'Complete los campos obligatorios: identificador, nombre, tipo y zona.';
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    if (this.modoEdicion && this.dispositivoSeleccionado) {
      this.actualizarDispositivo();
      return;
    }

    this.crearDispositivo();
  }

  private crearDispositivo(): void {
    this.deviceService.crear(this.dispositivoForm)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (nuevoDispositivo) => {
          this.dispositivos = [nuevoDispositivo, ...this.dispositivos];
          this.aplicarFiltros();
          this.successMessage = 'Dispositivo creado correctamente.';
          this.modalVisible = false;
          this.dispositivoForm = this.obtenerFormularioInicial();
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  private actualizarDispositivo(): void {
    if (!this.dispositivoSeleccionado) {
      return;
    }

    const id = this.dispositivoSeleccionado.id;

    this.deviceService.actualizar(id, this.dispositivoForm)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (dispositivoActualizado) => {
          this.dispositivos = this.dispositivos.map(dispositivo =>
            dispositivo.id === id ? dispositivoActualizado : dispositivo
          );

          this.aplicarFiltros();
          this.successMessage = 'Dispositivo actualizado correctamente.';
          this.modalVisible = false;
          this.dispositivoSeleccionado = null;
          this.dispositivoForm = this.obtenerFormularioInicial();
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  eliminarDispositivo(dispositivo: Device): void {
    const confirmar = confirm(`¿Desea eliminar el dispositivo "${dispositivo.name}"?`);

    if (!confirmar) {
      return;
    }

    this.deletingId = dispositivo.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.deviceService.eliminar(dispositivo.id)
      .pipe(
        finalize(() => {
          this.deletingId = null;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.dispositivos = this.dispositivos.filter(item => item.id !== dispositivo.id);
          this.aplicarFiltros();
          this.successMessage = 'Dispositivo eliminado correctamente.';
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  refrescar(): void {
    this.cargarDispositivos(false);
  }

  formularioValido(): boolean {
    return !!(
      this.dispositivoForm.device_id &&
      this.dispositivoForm.name &&
      this.dispositivoForm.device_type &&
      this.dispositivoForm.zone
    );
  }

  obtenerFormularioInicial(): Partial<Device> {
    return {
      device_id: '',
      name: '',
      device_type: '',
      firmware_version: '',
      ip_address: '',
      mac_address: '',
      status: 'ONLINE',
      active: true,
      zone: 1
    };
  }

  trackByDeviceId(index: number, dispositivo: Device): number {
    return dispositivo.id;
  }

  totalOnline(): number {
    return this.dispositivos.filter(d => this.normalizarTexto(d.status) === 'online').length;
  }

  totalOffline(): number {
    return this.dispositivos.filter(d =>
      this.normalizarTexto(d.status) === 'offline' ||
      this.normalizarTexto(d.status) === 'maintenance' ||
      !d.active
    ).length;
  }

  porcentajeOnline(): number {
    if (this.dispositivos.length === 0) {
      return 0;
    }

    return Math.round((this.totalOnline() / this.dispositivos.length) * 100);
  }

  obtenerTipos(): string[] {
    const tipos = this.dispositivos
      .map(dispositivo => dispositivo.device_type)
      .filter((tipo): tipo is string => !!tipo);

    return [...new Set(tipos)];
  }

  estaOnline(dispositivo: Device): boolean {
    return this.normalizarTexto(dispositivo.status) === 'online';
  }

  estaActivo(estado?: string): boolean {
    const estadoNormalizado = this.normalizarTexto(estado);

    return estadoNormalizado === 'activo' ||
      estadoNormalizado === 'active' ||
      estadoNormalizado === 'online' ||
      estadoNormalizado === '1';
  }

  etiquetaEstado(estado?: string): string {
    const valor = this.normalizarTexto(estado);

    if (valor === 'online') {
      return 'Online';
    }

    if (valor === 'offline') {
      return 'Offline';
    }

    if (valor === 'maintenance') {
      return 'Mantenimiento';
    }

    if (valor === 'activo' || valor === 'active') {
      return 'Activo';
    }

    return estado || 'Sin estado';
  }

  etiquetaTipo(tipo?: string): string {
    const valor = this.normalizarTexto(tipo);

    if (valor === 'controller') {
      return 'Controlador';
    }

    if (valor === 'sensor') {
      return 'Sensor';
    }

    if (valor === 'actuator') {
      return 'Actuador';
    }

    if (valor === 'gateway') {
      return 'Gateway';
    }

    return tipo || 'No definido';
  }

  private normalizarTexto(valor?: string | null): string {
    return (valor || '').toLowerCase().trim();
  }

  private obtenerMensajeError(error: any): string {
    if (error.status === 0) {
      return 'No fue posible conectarse con el servidor.';
    }

    if (error.status === 400 && error.error) {
      const errores = error.error;

      if (typeof errores === 'string') {
        return errores;
      }

      const primeraClave = Object.keys(errores)[0];

      if (primeraClave && Array.isArray(errores[primeraClave])) {
        return errores[primeraClave][0];
      }
    }

    if (error.status === 401) {
      return 'Su sesión no es válida. Inicie sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tiene permisos para realizar esta acción.';
    }

    if (error.status === 404) {
      return 'El recurso solicitado no fue encontrado.';
    }

    return 'Ocurrió un error al procesar la solicitud.';
  }
}