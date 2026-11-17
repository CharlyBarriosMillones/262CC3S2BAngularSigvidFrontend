import { Modulo } from './modulo';
import { Rol } from './rol';

export interface UserSesion {
  usuarioId: number;
  email: string;
  names: string;
  nombre: string;
  apellido: string;
  rol: string;
  role?: Rol;
  modulos: Modulo[];
}