import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { UserService, DjangoUsuario, CreateUsuarioPayload } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';

type TabVista = 'usuarios' | 'roles';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RolesComponent implements OnInit {

  tabActiva: TabVista = 'usuarios';

  usuarios: DjangoUsuario[] = [];
  usuariosFiltrados: DjangoUsuario[] = [];

  loading = false;
  saving = false;
  deletingId: number | null = null;

  errorMessage = '';
  successMessage = '';
  searchTerm = '';
  filtroRol = 'TODOS';

  modalVisible = false;
  modoEdicion = false;
  usuarioSeleccionado: DjangoUsuario | null = null;

  usuarioForm: CreateUsuarioPayload = this.formInicial();
  confirmarPassword = '';

  constructor(
    private userService: UserService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.userService.listar()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (data) => {
          this.usuarios = data ?? [];
          this.aplicarFiltros();
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  aplicarFiltros(): void {
    const termino = this.searchTerm.toLowerCase().trim();
    this.usuariosFiltrados = this.usuarios.filter(u => {
      const coincideBusqueda = !termino || [
        u.username, u.email, u.first_name, u.last_name
      ].filter(Boolean).join(' ').toLowerCase().includes(termino);

      const coincideRol =
        this.filtroRol === 'TODOS' ||
        (this.filtroRol === 'ADMIN' && u.is_staff) ||
        (this.filtroRol === 'OPERADOR' && !u.is_staff);

      return coincideBusqueda && coincideRol;
    });
    this.cdr.markForCheck();
  }

  buscar(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.aplicarFiltros();
  }

  cambiarFiltro(filtro: string): void {
    this.filtroRol = filtro;
    this.aplicarFiltros();
  }

  cambiarTab(tab: TabVista): void {
    this.tabActiva = tab;
    this.limpiarMensajes();
    this.cdr.markForCheck();
  }

  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.usuarioSeleccionado = null;
    this.usuarioForm = this.formInicial();
    this.confirmarPassword = '';
    this.limpiarMensajes();
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  abrirModalEditar(usuario: DjangoUsuario): void {
    this.modoEdicion = true;
    this.usuarioSeleccionado = usuario;
    this.usuarioForm = {
      username:  usuario.username,
      password:  '',
      email:     usuario.email || '',
      nombre:    usuario.first_name || '',
      apellido:  usuario.last_name || '',
      is_staff:  usuario.is_staff
    };
    this.confirmarPassword = '';
    this.limpiarMensajes();
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  cerrarModal(): void {
    if (this.saving) return;
    this.modalVisible = false;
    this.usuarioForm = this.formInicial();
    this.limpiarMensajes();
    this.cdr.markForCheck();
  }

  guardar(): void {
    this.limpiarMensajes();

    if (!this.usuarioForm.username.trim()) {
      this.errorMessage = 'El nombre de usuario es obligatorio.';
      this.cdr.markForCheck();
      return;
    }

    if (!this.modoEdicion && !this.usuarioForm.password) {
      this.errorMessage = 'La contraseña es obligatoria.';
      this.cdr.markForCheck();
      return;
    }

    if (this.usuarioForm.password && this.usuarioForm.password !== this.confirmarPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    const accion = this.modoEdicion && this.usuarioSeleccionado
      ? this.userService.actualizar(this.usuarioSeleccionado.id, this.usuarioForm)
      : this.userService.crear(this.usuarioForm);

    accion.pipe(finalize(() => {
      this.saving = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => {
        this.successMessage = this.modoEdicion
          ? 'Usuario actualizado correctamente.'
          : 'Usuario creado correctamente.';
        this.modalVisible = false;
        this.cargarUsuarios();
      },
      error: (error) => {
        this.errorMessage = this.obtenerMensajeError(error);
      }
    });
  }

  eliminar(usuario: DjangoUsuario): void {
    if (!confirm(`¿Desea eliminar el usuario "${usuario.username}"?`)) return;

    this.deletingId = usuario.id;
    this.limpiarMensajes();
    this.cdr.markForCheck();

    this.userService.eliminar(usuario.id)
      .pipe(finalize(() => {
        this.deletingId = null;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
          this.aplicarFiltros();
          this.successMessage = 'Usuario eliminado correctamente.';
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(error);
        }
      });
  }

  getRol(usuario: DjangoUsuario): string {
    return usuario.is_staff ? 'Administrador' : 'Operador';
  }

  getRolClass(usuario: DjangoUsuario): string {
    return usuario.is_staff ? 'badge-admin' : 'badge-operador';
  }

  getInicial(usuario: DjangoUsuario): string {
    return (usuario.first_name || usuario.username).charAt(0).toUpperCase();
  }

  totalAdmins(): number {
    return this.usuarios.filter(u => u.is_staff).length;
  }

  totalOperadores(): number {
    return this.usuarios.filter(u => !u.is_staff).length;
  }

  formInicial(): CreateUsuarioPayload {
    return {
      username:  '',
      password:  '',
      email:     '',
      nombre:    '',
      apellido:  '',
      is_staff:  false
    };
  }

  limpiarMensajes(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  trackById(index: number, item: DjangoUsuario): number {
    return item.id;
  }

  private obtenerMensajeError(error: any): string {
    if (error.status === 0) return 'No fue posible conectarse con el servidor.';
    if (error.status === 401) return 'Sesión no válida. Inicie sesión nuevamente.';
    if (error.status === 403) return 'No tiene permisos para realizar esta acción.';
    if (error.status === 400 && error.error) {
      if (typeof error.error === 'string') return error.error;
      if (error.error.error) return error.error.error;
    }
    return 'Ocurrió un error al procesar la solicitud.';
  }
}