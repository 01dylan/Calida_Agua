import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ComunidadService, Comunidad } from '../../core/services/comunidad.service';
import { DeviceService } from '../../core/services/device.service';
import { AuthService } from '../../core/services/auth.service';
@Component({
  selector: 'app-comunidades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comunidades.html',
  styleUrl: './comunidades.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Comunidades implements OnInit {

  comunidades: Comunidad[] = [];
  loading = false;
  saving = false;
  deletingId: number | null = null;

  errorMessage = '';
  successMessage = '';

  searchTerm = '';
  comunidadesFiltradas: Comunidad[] = [];

  modalVisible = false;
  modoEdicion = false;
  comunidadSeleccionada: Comunidad | null = null;

  form: Partial<Comunidad> = this.formInicial();

  // Conteo de dispositivos por comunidad
  dispositivosPorComunidad: Record<number, number> = {};
  esAdmin = false;

  constructor(
    private comunidadService: ComunidadService,
    private deviceService: DeviceService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
  this.esAdmin = this.authService.isAdmin();
  this.cargarDatos();
}

  cargarDatos(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.comunidadService.listar()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (data) => {
          this.comunidades = data ?? [];
          this.aplicarFiltros();
          this.cargarConteoDispositivos();
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  cargarConteoDispositivos(): void {
    this.deviceService.listar().subscribe({
      next: (dispositivos) => {
        const conteo: Record<number, number> = {};
        dispositivos.forEach(d => {
          conteo[d.comunidad_id] = (conteo[d.comunidad_id] || 0) + 1;
        });
        this.dispositivosPorComunidad = conteo;
        this.cdr.markForCheck();
      }
    });
  }

  aplicarFiltros(): void {
    const termino = this.searchTerm.toLowerCase().trim();
    this.comunidadesFiltradas = this.comunidades.filter(c =>
      !termino || [c.nombre, c.descripcion, c.ubicacion]
        .filter(Boolean).join(' ').toLowerCase().includes(termino)
    );
    this.cdr.markForCheck();
  }

  buscar(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.aplicarFiltros();
  }

  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.comunidadSeleccionada = null;
    this.form = this.formInicial();
    this.limpiarMensajes();
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  abrirModalEditar(comunidad: Comunidad): void {
    this.modoEdicion = true;
    this.comunidadSeleccionada = comunidad;
    this.form = {
      nombre:      comunidad.nombre,
      descripcion: comunidad.descripcion || '',
      ubicacion:   comunidad.ubicacion || '',
      latitud:     comunidad.latitud || null,
      longitud:    comunidad.longitud || null,
      activo:      comunidad.activo ?? true
    };
    this.limpiarMensajes();
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  cerrarModal(): void {
    if (this.saving) return;
    this.modalVisible = false;
    this.form = this.formInicial();
    this.limpiarMensajes();
    this.cdr.markForCheck();
  }

  guardar(): void {
    this.limpiarMensajes();

    if (!this.form.nombre?.trim()) {
      this.errorMessage = 'El nombre de la comunidad es obligatorio.';
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    const accion = this.modoEdicion && this.comunidadSeleccionada
      ? this.comunidadService.actualizar(this.comunidadSeleccionada.id, this.form)
      : this.comunidadService.crear(this.form);

    accion.pipe(finalize(() => {
      this.saving = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => {
        this.successMessage = this.modoEdicion
          ? 'Comunidad actualizada correctamente.'
          : 'Comunidad creada correctamente.';
        this.modalVisible = false;
        this.cargarDatos();
      },
      error: (error) => {
        this.errorMessage = this.obtenerMensajeError(error);
      }
    });
  }

  eliminar(comunidad: Comunidad): void {
    if (!confirm(`¿Desea eliminar la comunidad "${comunidad.nombre}"?`)) return;

    this.deletingId = comunidad.id;
    this.limpiarMensajes();
    this.cdr.markForCheck();

    this.comunidadService.eliminar(comunidad.id)
      .pipe(finalize(() => {
        this.deletingId = null;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.comunidades = this.comunidades.filter(c => c.id !== comunidad.id);
          this.aplicarFiltros();
          this.successMessage = 'Comunidad eliminada correctamente.';
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  dispositivosDe(id: number): number {
    return this.dispositivosPorComunidad[id] || 0;
  }

  totalActivas(): number {
    return this.comunidades.filter(c => c.activo !== false).length;
  }

  formInicial(): Partial<Comunidad> {
    return {
      nombre: '',
      descripcion: '',
      ubicacion: '',
      latitud: null,
      longitud: null,
      activo: true
    };
  }

  limpiarMensajes(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  trackById(index: number, item: Comunidad): number {
    return item.id;
  }

  private obtenerMensajeError(error: any): string {
    if (error.status === 0) return 'No fue posible conectarse con el servidor.';
    if (error.status === 401) return 'Sesión no válida. Inicie sesión nuevamente.';
    if (error.status === 404) return 'Recurso no encontrado.';
    if (error.status === 400 && error.error) {
      if (typeof error.error === 'string') return error.error;
      const key = Object.keys(error.error)[0];
      if (key && Array.isArray(error.error[key])) return error.error[key][0];
    }
    return 'Ocurrió un error al procesar la solicitud.';
  }
}