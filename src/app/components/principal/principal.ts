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

  // gestion de usuarios (para el Admin)
  mostrarPanelUsuarios = false;
  rolesDisponibles: Rol[] = [];
  listaUsuarios: any[] = [];
  mensajeExito = '';
  mensajeError = '';
  guardandoUsuario = false;

  // gestion de perfil de usuario
  mostrarPanelPerfil = false;
  fotoPerfilUrl: string | null = null;
  mensajePerfilExito = '';
  guardandoPerfil = false;

  formPerfil = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    apellido: new FormControl('', [Validators.required]),
    telefono: new FormControl(''),
    preferenciaCategoria: new FormControl('Vinos Tintos Gran Reserva'),
    preferenciaMaridaje: new FormControl('Carnes rojas y quesos maduros'),
    notifEstadoPedidos: new FormControl(true),
    notifPromocionesEmail: new FormControl(true),
    notifNuevasCosechas: new FormControl(false)
  });

  // visualizacion del historial de pedidos (para clientes)
  mostrarPanelPedidosCliente = false;
  historialPedidosCliente = [
    {
      codigoPedido: 'PED-2026-0014',
      fechaSolicitud: '10/10/2026 18:45',
      detalle: '2x Gran Reserva Malbec, 1x Pisco Mosto Verde Italia',
      sucursal: 'Sede Central - Ica',
      estado: 'Entregado',
      importeTotal: 265.00
    },
    {
      codigoPedido: 'PED-2026-0021',
      fechaSolicitud: '14/10/2026 11:20',
      detalle: '1x Valle Sagrado Tannat, 1x Lote Corcho Natural Flor (50 uds)',
      sucursal: 'Sede Central - Ica',
      estado: 'En Camino',
      importeTotal: 170.50
    },
    {
      codigoPedido: 'PED-2026-0028',
      fechaSolicitud: '15/10/2026 19:30',
      detalle: '2x Pisco Acholado Premium',
      sucursal: 'Sede Lima - Miraflores',
      estado: 'Confirmado',
      importeTotal: 150.00
    }
  ];

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
    // si no ha iniciado sesion, lo regresamos al login
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.usuario = this.authService.getUsuarioActual();
    this.cargarDatosPerfilDesdeBD();
    this.cargarPanelPorRol(this.usuario?.rol || 'Cliente');
  }

  esAdmin(): boolean {
    return this.usuario?.rol?.toLowerCase().trim() === 'administrador';
  }

  esCliente(): boolean {
    return (this.usuario?.rol?.toLowerCase().trim() || 'cliente') === 'cliente';
  }

  abrirModulo(modulo: Modulo): void {
    this.mensajePerfilExito = '';

    if (this.esAdmin() && modulo.nombre === 'Usuarios y Personal') {
      this.mostrarPanelUsuarios = !this.mostrarPanelUsuarios;
      this.mostrarPanelPerfil = false;
      this.mostrarPanelPedidosCliente = false;
      if (this.mostrarPanelUsuarios) {
        this.cargarRolesYUsuarios();
      }
      return;
    }

    if (modulo.nombre === 'Mi Perfil y Preferencias') {
      this.mostrarPanelPerfil = !this.mostrarPanelPerfil;
      this.mostrarPanelUsuarios = false;
      this.mostrarPanelPedidosCliente = false;
      return;
    }

    if (modulo.nombre === 'Mis Pedidos y Cuenta') {
      this.mostrarPanelPedidosCliente = !this.mostrarPanelPedidosCliente;
      this.mostrarPanelPerfil = false;
      this.mostrarPanelUsuarios = false;
      return;
    }

    if (modulo.ruta && modulo.ruta !== '/principal') {
      this.router.navigate([modulo.ruta]);
    }
  }

  // cnsultamos los datos reales del usuario
  private cargarDatosPerfilDesdeBD(): void {
    if (!this.usuario?.email) return;

    this.authService.obtenerPerfil(this.usuario.email).subscribe({
      next: (perfil) => {
        this.usuario!.nombre = perfil.nombre;
        this.usuario!.apellido = perfil.apellido;
        this.fotoPerfilUrl = perfil.fotoPerfil || null;

        this.formPerfil.patchValue({
          nombre: perfil.nombre,
          apellido: perfil.apellido,
          telefono: perfil.telefono || '',
          preferenciaCategoria: perfil.preferenciaCategoria || 'Vinos Tintos Gran Reserva',
          preferenciaMaridaje: perfil.preferenciaMaridaje || 'Carnes rojas y quesos maduros',
          notifEstadoPedidos: perfil.notifEstadoPedidos ?? true,
          notifPromocionesEmail: perfil.notifPromocionesEmail ?? true,
          notifNuevasCosechas: perfil.notifNuevasCosechas ?? false
        });
        this.cdr.detectChanges();
      }
    });
  }

  // comprimimos la foto a 250x250px (~15KB) y la convierte a Base64 para guardarla en la BD
  onSeleccionarFotoPerfil(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const archivo = input.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 250;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, size, size);
          this.fotoPerfilUrl = canvas.toDataURL('image/jpeg', 0.8);
          this.cdr.detectChanges();
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(archivo);
  }

  // guarda nombre, foto y preferencias 
  guardarCambiosPerfil(): void {
    if (this.formPerfil.invalid || !this.usuario) {
      this.formPerfil.markAllAsTouched();
      return;
    }

    this.guardandoPerfil = true;
    this.mensajePerfilExito = '';
    const val = this.formPerfil.value;

    const payload = {
      email: this.usuario.email,
      nombre: val.nombre!.trim(),
      apellido: val.apellido!.trim(),
      telefono: val.telefono?.trim() || null,
      fotoPerfil: this.fotoPerfilUrl,
      preferenciaCategoria: val.preferenciaCategoria,
      preferenciaMaridaje: val.preferenciaMaridaje,
      notifEstadoPedidos: val.notifEstadoPedidos,
      notifPromocionesEmail: val.notifPromocionesEmail,
      notifNuevasCosechas: val.notifNuevasCosechas
    };

    this.authService.actualizarPerfil(payload).subscribe({
      next: (actualizado) => {
        this.guardandoPerfil = false;
        this.usuario!.nombre = actualizado.nombre;
        this.usuario!.apellido = actualizado.apellido;
        this.fotoPerfilUrl = actualizado.fotoPerfil || null;
        this.mensajePerfilExito = 'Cambios guardados exitosamente en la base de datos de Neon.';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.guardandoPerfil = false;
        this.mensajeError = err.error?.message || 'Error al guardar el perfil en la base de datos.';
        this.cdr.detectChanges();
      }
    });
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
            nombre: 'Mi Perfil y Preferencias',
            descripcion: 'Edita tu nombre, foto de perfil y configuración de notificaciones por email.',
            icono: 'bi-person-lines-fill',
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
            nombre: 'Mi Perfil y Preferencias',
            descripcion: 'Edita tu nombre, foto de perfil y notificaciones por correo.',
            icono: 'bi-person-lines-fill',
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
          },
          {
            nombre: 'Mi Perfil y Preferencias',
            descripcion: 'Edita tu nombre, foto de perfil y notificaciones por correo.',
            icono: 'bi-person-lines-fill',
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
          },
          {
            nombre: 'Mi Perfil y Preferencias',
            descripcion: 'Edita tu nombre, foto de perfil y alertas de almacén por email.',
            icono: 'bi-person-lines-fill',
            ruta: '/principal'
          }
        ];
        break;

      case 'cliente':
      default:
        this.tituloPanel = 'Portal Exclusivo de Cliente';
        this.descripcionPanel = 'Disfruta de nuestra selección Gran Reserva, realiza pedidos y revisa tus compras.';
        this.modulos = [
          {
            nombre: 'Mi Perfil y Preferencias',
            descripcion: 'Edita tu nombre, foto de perfil, preferencias y notificaciones por correo.',
            icono: 'bi-person-lines-fill',
            ruta: '/principal'
          },
          {
            nombre: 'Mis Pedidos y Cuenta',
            descripcion: 'Visualiza tu historial de pedidos realizados, estados de entrega e importes.',
            icono: 'bi-bag-heart-fill',
            ruta: '/principal'
          },
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