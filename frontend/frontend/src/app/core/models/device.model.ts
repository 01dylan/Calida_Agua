// src/app/core/models/device.model.ts

export interface Device {
  id: number;
  comunidad_id: number;
  actuador_id?: number | null;
  nombre: string;
  mac_address?: string;
  ip_address?: string;
  ubicacion?: string;
  firmware?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Lectura {
  id: number;
  dispositivo_id: number;
  temperatura: number;
  turbidez: number;
  conductividad: number;
  ph: number;
  estado: string;
  fuente: 'ESP32' | 'MANUAL';
  registrado_por?: string;
  fecha: string;
}

export interface LecturaPayload {
  dispositivo_id: number;
  temperatura: number;
  turbidez: number;
  conductividad: number;
  ph: number;
  fecha: string;
  fuente: 'ESP32' | 'MANUAL';
  registrado_por?: string;
}