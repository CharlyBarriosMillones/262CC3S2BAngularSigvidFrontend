import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Vinos } from './components/vinos/vinos';
import { Piscos } from './components/piscos/piscos';
import { Corchos } from './components/corchos/corchos';
import { InicioSesion } from './components/acceso/inicio-sesion/inicio-sesion';
import { Registro } from './components/acceso/registro/registro';
import { Principal } from './components/principal/principal';
import { CatalogoProductos } from './components/gestion-ventas/catalogo-productos/catalogo-productos';
import { RegistrarPedido } from './components/gestion-ventas/registrar-pedido/registrar-pedido';
import { RegistrarPago } from './components/gestion-ventas/registrar-pago/registrar-pago';
import { DerivarPedido } from './components/gestion-ventas/derivar-pedido/derivar-pedido';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: InicioSesion },
  { path: 'register', component: Registro },
  {
    path: 'principal',
    component: Principal,
    children: [
      { path: 'catalogo', component: CatalogoProductos },
      { path: 'registrar-pedido', component: RegistrarPedido },
      { path: 'registrar-pago', component: RegistrarPago },
      { path: 'derivar-pedido', component: DerivarPedido },
      { path: 'stock-almacen', component: DerivarPedido },
      { path: 'sucursales', component: CatalogoProductos },
    ],
  },
  { path: 'vinos', component: Vinos },
  { path: 'piscos', component: Piscos },
  { path: 'corchos', component: Corchos },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];