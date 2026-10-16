import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Vinos } from './components/vinos/vinos';
import { Piscos } from './components/piscos/piscos';
import { Corchos } from './components/corchos/corchos';
import { InicioSesion } from './components/acceso/inicio-sesion/inicio-sesion';
import { Registro } from './components/acceso/registro/registro';
import { Principal } from './components/principal/principal';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: InicioSesion },
  { path: 'register', component: Registro },
  { path: 'principal', component: Principal },
  { path: 'vinos', component: Vinos },
  { path: 'piscos', component: Piscos },
  { path: 'corchos', component: Corchos },
  // si el usuario escribe una ruta que no existe, lo regresamos al home:
  { path: '**', redirectTo: '', pathMatch: 'full' } 
];