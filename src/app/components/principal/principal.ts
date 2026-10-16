import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserSesion } from '../../model/user-sesion';
import { Modulo } from '../../model/modulo';
import { Rol } from '../../model/rol';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './principal.html',
  styleUrl: './principal.scss',
})

export class Principal implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  usuario: UserSesion | null = null;
  modulos: Modulo[] = [];
  tituloPanel: string = 'Panel del Sistema';
  descripcionPanel: string = 'Gestiona tus actividades y accede a los módulos disponibles en el sistema.';

  // gestion de los usuarios (exclusivo del admin)
  mostrarPanelUsuarios = false;
  rolesDisponibles: Rol[] = [];
  listaUsuarios: any[] = [];
  mensajeExito = '';
  mensajeError = '';
  guardandoUsuario = false;

  formNuevoUsuario = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    apellido: new FormControl('', [Validators.required]),
    dni: new FormControl('', [Validators.required, Validators.pattern(/^\d{8}$/)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    telefono: new FormControl(''),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    idRol: new FormControl<number | null>(null, [Validators.required])
  });

  ngOnInit(): void {
    // si no inicia sesion, se regresa al login
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.usuario = this.authService.getUsuarioActual();
    this.cargarPanelPorRol(this.usuario?.rol || 'Cliente');
  }

  esAdmin(): boolean {
    return this.usuario?.rol?.toLowerCase().trim() === 'administrador';
  }

  abrirModulo(modulo: Modulo): void {
    if (this.esAdmin() && modulo.nombre === 'Usuarios y Personal') {
      this.mostrarPanelUsuarios = !this.mostrarPanelUsuarios;
      if (this.mostrarPanelUsuarios) {
        this.cargarRolesYUsuarios();
      }
      return;
    }
    if (modulo.ruta && modulo.ruta !== '/principal') {
      this.router.navigate([modulo.ruta]);
    }
  }

  cargarRolesYUsuarios(): void {
    this.http.get<Rol[]>(`${environment.apiUrl}/roles`).subscribe({
      next: (roles) => {
        this.rolesDisponibles = roles;
        this.cdr.detectChanges();
      }
    });
    this.http.get<any[]>(`${environment.apiUrl}/usuarios`).subscribe({
      next: (usuarios) => {
        this.listaUsuarios = usuarios;
        this.cdr.detectChanges();
      }
    });
  }

  crearUsuarioDesdeAdmin(): void {
    if (this.formNuevoUsuario.invalid) {
      this.formNuevoUsuario.markAllAsTouched();
      return;
    }

    this.mensajeExito = '';
    this.mensajeError = '';
    this.guardandoUsuario = true;

    const val = this.formNuevoUsuario.value;
    const payload = {
      nombre: val.nombre,
      apellido: val.apellido,
      dni: val.dni,
      email: val.email,
      telefono: val.telefono || null,
      password: val.password,
      idRol: Number(val.idRol)
    };

    this.http.post<any>(`${environment.apiUrl}/usuarios`, payload).subscribe({
      next: (nuevo) => {
        this.guardandoUsuario = false;
        this.mensajeExito = `Usuario ${nuevo.nombre} (${nuevo.nombreRol}) registrado exitosamente en Neon.`;
        this.formNuevoUsuario.reset();
        this.cargarRolesYUsuarios();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.guardandoUsuario = false;
        this.mensajeError = err.error?.message || 'Error al registrar el usuario. Verifica DNI o Correo.';
        this.cdr.detectChanges();
      }
    });
  }

  private cargarPanelPorRol(rol: string): void {
    switch (rol.toLowerCase().trim()) {
      case 'administrador':
        this.tituloPanel = 'Panel de Administración';
        this.descripcionPanel = 'Supervisa las operaciones globales, usuarios, sucursales y catálogo de Vitivinícolas Perú.';
        this.modulos = [
          { 
            nombre: 'Usuarios y Personal', 
            descripcion: 'Crea cuentas para vendedores, cajeros, almaceneros o clientes.', 
            icono: 'bi-people-fill', 
            ruta: '/principal' 
          },
          { 
            nombre: 'Catálogo Vitivinícola', 
            descripcion: 'Gestiona vinos, piscos, lotes de corchos, precios y cosechas.', 
            icono: 'bi-collection-fill', 
            ruta: '/vinos' 
          },
          { 
            nombre: 'Sucursales y Sedes', 
            descripcion: 'Controla las sedes operativas y puntos de distribución.', 
            icono: 'bi-building-fill-gear', 
            ruta: '/principal' 
          },
          { 
            nombre: 'Reportes y Métricas', 
            descripcion: 'Visualiza el rendimiento de ventas e ingresos de la empresa.', 
            icono: 'bi-bar-chart-line-fill', 
            ruta: '/principal' 
          }
        ];
        break;
      case 'vendedor':
        this.tituloPanel = 'Panel de Ventas';
        this.descripcionPanel = 'Gestiona pedidos comerciales, cotizaciones de lotes y atención a clientes.';
        this.modulos = [
          { 
            nombre: 'Registrar Pedido', 
            descripcion: 'Genera nuevas órdenes de venta de vinos, piscos y corchos.', 
            icono: 'bi-cart-plus-fill', 
            ruta: '/principal' 
          },
          { 
            nombre: 'Cartera de Clientes', 
            descripcion: 'Consulta y registra clientes corporativos y particulares.', 
            icono: 'bi-person-vcard-fill', 
            ruta: '/principal' 
          },
          { 
            nombre: 'Consultar Catálogo', 
            descripcion: 'Revisa disponibilidad de productos, precios y notas de cata.', 
            icono: 'bi-journal-richtext', 
            ruta: '/vinos' 
          }
        ];
        break;
      case 'cajero':
        this.tituloPanel = 'Panel de Caja y Facturación';
        this.descripcionPanel = 'Procesa pagos, emite boletas o facturas y realiza el cuadre de caja.';
        this.modulos = [
          { 
            nombre: 'Cobros y Facturación', 
            descripcion: 'Registra pagos de pedidos pendientes y emite comprobantes.', 
            icono: 'bi-cash-coin', 
            ruta: '/principal' 
          },
          { 
            nombre: 'Historial de Comprobantes', 
            descripcion: 'Consulta boletas y facturas emitidas en tu turno.', 
            icono: 'bi-receipt-cutoff', 
            ruta: '/principal' 
          },
          { 
            nombre: 'Arqueo de Caja', 
            descripcion: 'Realiza la apertura y cierre de tu caja asignada.', 
            icono: 'bi-safe2-fill', 
            ruta: '/principal' 
          }
        ];
        break;
      case 'almacenero':
        this.tituloPanel = 'Panel de Almacén y Logística';
        this.descripcionPanel = 'Controla el stock de botellas, insumos de corcho y despachos entre sucursales.';
        this.modulos = [
          { 
            nombre: 'Control de Inventario', 
            descripcion: 'Verifica entradas, salidas y stock actual en almacén.', 
            icono: 'bi-boxes', 
            ruta: '/principal' 
          },
          { 
            nombre: 'Despacho de Pedidos', 
            descripcion: 'Prepara y aprueba la salida de lotes vendidos.', 
            icono: 'bi-truck', 
            ruta: '/principal' 
          },
          { 
            nombre: 'Lotes y Proveedores', 
            descripcion: 'Registra el ingreso de nuevas cosechas y corchos.', 
            icono: 'bi-clipboard2-check-fill', 
            ruta: '/principal' 
          }
        ];
        break;
      default:
        this.tituloPanel = 'Portal Exclusivo de Cliente';
        this.descripcionPanel = 'Disfruta de nuestra selección Gran Reserva, realiza pedidos y revisa tus compras.';
        this.modulos = [
          { 
            nombre: 'Colección de Vinos', 
            descripcion: 'Descubre nuestros vinos Gran Reserva y realiza tu selección.', 
            icono: 'bi-cup-straw', 
            ruta: '/vinos' 
          },
          { 
            nombre: 'Colección de Piscos', 
            descripcion: 'Explora nuestros destilados puros, mosto verde y acholados.', 
            icono: 'bi-droplet-half', 
            ruta: '/piscos' 
          },
          { 
            nombre: 'Catálogo de Corchos', 
            descripcion: 'Solicita lotes de corchos naturales y microaglomerados.', 
            icono: 'bi-layers-fill', 
            ruta: '/corchos' 
          },
          { 
            nombre: 'Mis Pedidos y Cuenta', 
            descripcion: 'Consulta el estado de tus compras, comprobantes y datos personales.', 
            icono: 'bi-bag-heart-fill', 
            ruta: '/principal' 
          }
        ];
        break;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}