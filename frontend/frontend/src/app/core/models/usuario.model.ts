export interface Usuario {
  idusuarios: number;
  username: string;
  email?: string;
  nombre?: string;
  apellido?: string;
  estado: string;
}

export interface PaginatedUsuarioResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Usuario[];
}