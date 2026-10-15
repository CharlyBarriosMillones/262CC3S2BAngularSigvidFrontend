export interface RegisterRequest {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono?: string;
  password: string;
  tipoUsuario?: string;
  nombreRol?: string;
  ruc?: string;
  razonSocial?: string;
  direccion?: string;
}