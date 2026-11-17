import { Modulo } from '../../modulo';

export interface UserResponse {
  token: string;
  idUsuario: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  modulos: Modulo[];
}