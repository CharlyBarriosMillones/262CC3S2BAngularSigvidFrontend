import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Vinos } from './components/vinos/vinos';
import { Piscos } from './components/piscos/piscos';
import { Corchos } from './components/corchos/corchos';
import { InicioSesion } from './components/acceso/inicio-sesion/inicio-sesion';
import { Registro } from './components/acceso/registro/registro';
import { Principal } from './components/principal/principal';
import { authGuard } from './guards/auth-guards';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: InicioSesion },
  { path: 'register', component: Registro },
  {
    path: 'principal',
    component: Principal,
    canActivate: [authGuard],
    children: [
      // modulos del panel con carga diferida (lazy) para no agrandar el bundle inicial
      {
        path: 'catalogo',
        loadComponent: () =>
          import('./components/gestion-ventas/catalogo-productos/catalogo-productos').then((m) => m.CatalogoProductos),
      },
      {
        path: 'registrar-pedido',
        loadComponent: () =>
          import('./components/gestion-ventas/registrar-pedido/registrar-pedido').then((m) => m.RegistrarPedido),
      },
      {
        path: 'registrar-pago',
        loadComponent: () =>
          import('./components/gestion-ventas/registrar-pago/registrar-pago').then((m) => m.RegistrarPago),
      },
      {
        path: 'derivar-pedido',
        loadComponent: () =>
          import('./components/gestion-ventas/derivar-pedido/derivar-pedido').then((m) => m.DerivarPedido),
      },
      {
        path: 'stock-almacen',
        loadComponent: () =>
          import('./components/gestion-almacen/consultar-stock/consultar-stock').then((m) => m.ConsultarStock),
      },
      {
        path: 'asignar-pedido',
        loadComponent: () =>
          import('./components/gestion-almacen/asignar-pedido/asignar-pedido').then((m) => m.AsignarPedido),
      },
      {
        path: 'registrar-salida',
        loadComponent: () =>
          import('./components/gestion-almacen/registrar-salida/registrar-salida').then((m) => m.RegistrarSalida),
      },
      {
        path: 'confirmar-recepcion',
        loadComponent: () =>
          import('./components/gestion-ventas/confirmar-recepcion/confirmar-recepcion').then((m) => m.ConfirmarRecepcion),
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard').then((m) => m.Dashboard),
      },
    ],
  },
  { path: 'vinos', component: Vinos },
  { path: 'piscos', component: Piscos },
  { path: 'corchos', component: Corchos },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];