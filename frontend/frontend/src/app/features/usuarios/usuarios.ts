import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Usuario } from '../../core/models/usuario.model';
import { UsuarioService } from '../../core/services/usuario.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class UsuariosComponent implements OnInit {

  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];

  loading = false;
  errorMessage = '';
  searchTerm = '';

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading = true;
    this.errorMessage = '';

    this.usuarioService.listar().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.usuariosFiltrados = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar los usuarios.';
        this.loading = false;
      }
    });
  }

  buscar(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase().trim();

    this.usuariosFiltrados = this.usuarios.filter(usuario =>
      usuario.nombre?.toLowerCase().includes(this.searchTerm) ||
      usuario.apellido?.toLowerCase().includes(this.searchTerm) ||
      usuario.username?.toLowerCase().includes(this.searchTerm)
    );
  }

  editar(usuario: Usuario): void {
    console.log('Editar usuario:', usuario);
  }

  eliminar(usuario: Usuario): void {
    const confirmar = confirm(`¿Desea eliminar el usuario ${usuario.username}?`);

    if (!confirmar) {
      return;
    }

    this.usuarioService.eliminar(usuario.idusuarios).subscribe({
      next: () => {
        this.cargarUsuarios();
      },
      error: () => {
        this.errorMessage = 'No fue posible eliminar el usuario.';
      }
    });
  }
}