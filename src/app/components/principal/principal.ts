import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
import { SessionService } from '../../services/session.service';
import { UsuarioService } from '../../services/usuario.service';
import { ToastService } from '../../services/toast.service';
import { UserSesion } from '../../model/user-sesion';
import { Modulo } from '../../model/modulo';
import { Rol } from '../../model/rol';
import { environment } from '../../environments/environment';
import { Limites, Patrones } from '../../util/patrones';
import { RegexConstants } from '../../util/constant';

@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, NgxPaginationModule],
  templateUrl: './principal.html',
  styleUrl: './principal.scss',
})
export class Principal implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly sessionService = inject(SessionService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly toastService = inject(ToastService);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  public RG = RegexConstants;

  usuario: UserSesion | null = null;
  modulos: Modulo[] = [];
  moduloActivoUrl: string = '';
  tituloPanel: string = 'Panel de Gestión Vitivinícola';
  descripcionPanel: string = 'Selecciona una opción del menú dinámico habilitada para tu perfil de usuario.';

  mostrarPanelUsuarios = false;
  mostrarPanelPerfil = false;
  mostrarPanelPedidosCliente = false;
  mostrarPanelSucursales = false;

  rolesDisponibles: Rol[] = [];
  listaUsuarios: any[] = [];
  listaSucursales: any[] = [];
  historialPedidosCliente: any[] = [];
  fotoPerfilUrl: string | null = null;
  guardandoUsuario = false;
  guardandoPerfil = false;
  guardandoSucursal = false;

  pageUsuarios: number = 1;
  pageSucursales: number = 1;
  pageHistorial: number = 1;

  formPerfil = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.pattern(Patrones.NOMBRE)]),
    apellido: new FormControl('', [Validators.required, Validators.pattern(Patrones.NOMBRE)]),
    telefono: new FormControl('', [Validators.pattern(Patrones.TELEFONO)]),
    preferenciaCategoria: new FormControl('Vinos Tintos Gran Reserva', [Validators.maxLength(100), Validators.pattern(Patrones.TEXTO_SEGURO)]),
    preferenciaMaridaje: new FormControl('Carnes rojas y quesos maduros', [Validators.maxLength(150), Validators.pattern(Patrones.TEXTO_SEGURO)]),
    notifEstadoPedidos: new FormControl(true),
    notifPromocionesEmail: new FormControl(true),
    notifNuevasCosechas: new FormControl(false),
  });

  formNuevoUsuario = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.pattern(Patrones.NOMBRE)]),
    apellido: new FormControl('', [Validators.required, Validators.pattern(Patrones.NOMBRE)]),
    dni: new FormControl('', [Validators.required, Validators.pattern(Patrones.DNI)]),
    email: new FormControl('', [Validators.required, Validators.email, Validators.pattern(Patrones.EMAIL), Validators.maxLength(Limites.EMAIL_MAX)]),
    telefono: new FormControl('', [Validators.pattern(Patrones.TELEFONO)]),
    password: new FormControl('', [Validators.required, Validators.minLength(Limites.PASSWORD_MIN), Validators.maxLength(Limites.PASSWORD_MAX)]),
    idRol: new FormControl<number | null>(null, [Validators.required]),
  });

  formNuevaSucursal = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.maxLength(100), Validators.pattern(Patrones.TEXTO_SEGURO)]),
    direccion: new FormControl('', [Validators.required, Validators.pattern(Patrones.TEXTO_SEGURO)]),
    telefono: new FormControl('', [Validators.pattern(Patrones.TELEFONO)]),
  });

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.usuario = this.sessionService.getInfoSession();
    if (!this.usuario) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    this.tituloPanel = `Panel de ${this.usuario.rol}`;
    this.modulos = this.usuario.modulos || [];

    if (this.modulos.length === 0 && this.usuario.role?.idRol) {
      this.usuarioService.listarModulosPorRol(this.usuario.role.idRol).subscribe({
        next: (mods) => {
          this.modulos = mods;
          this.redirigirADashboardInicial();
          this.cdr.detectChanges();
        },
      });
    } else {
      this.redirigirADashboardInicial();
    }

    this.cargarDatosPerfilDesdeBD();
  }

  private redirigirADashboardInicial(): void {
    if (this.router.url === '/principal' || this.router.url === '/principal/') {
      const firstModule =
        this.modulos.find((m) => m.ordenOpcion === 1 && m.url?.endsWith('/dashboard')) ||
        this.modulos.find((m) => m.url?.endsWith('/dashboard'));
      const targetUrl = firstModule?.url || '/principal/dashboard';
      this.moduloActivoUrl = targetUrl;
      this.router.navigate([targetUrl]);
    } else {
      this.moduloActivoUrl = this.router.url;
    }
  }

  esAdmin(): boolean {
    return this.usuario?.rol?.toLowerCase().trim() === 'administrador';
  }

  esCliente(): boolean {
    return (this.usuario?.rol?.toLowerCase().trim() || 'cliente') === 'cliente';
  }

  private cerrarPanelesLocales(): void {
    this.mostrarPanelUsuarios = false;
    this.mostrarPanelPerfil = false;
    this.mostrarPanelPedidosCliente = false;
    this.mostrarPanelSucursales = false;
  }

  abrirModulo(modulo: Modulo): void {
    const url = modulo.url || '';
    this.moduloActivoUrl = url;

    if (url.endsWith('/perfil') || modulo.nombre === 'Mi Perfil y Preferencias') {
      const estado = !this.mostrarPanelPerfil;
      this.cerrarPanelesLocales();
      this.mostrarPanelPerfil = estado;
      this.router.navigate([estado ? '/principal' : '/principal/dashboard']);
      return;
    }

    if (url.endsWith('/usuarios') || modulo.nombre === 'Usuarios y Personal') {
      const estado = !this.mostrarPanelUsuarios;
      this.cerrarPanelesLocales();
      this.mostrarPanelUsuarios = estado;
      if (this.mostrarPanelUsuarios) {
        this.cargarRolesYUsuarios();
      }
      this.router.navigate([estado ? '/principal' : '/principal/dashboard']);
      return;
    }

    if (url.endsWith('/sucursales') || modulo.nombre === 'Sucursales y Roles') {
      const estado = !this.mostrarPanelSucursales;
      this.cerrarPanelesLocales();
      this.mostrarPanelSucursales = estado;
      if (this.mostrarPanelSucursales) {
        this.cargarSucursalesYRoles();
      }
      this.router.navigate([estado ? '/principal' : '/principal/dashboard']);
      return;
    }

    if (url.endsWith('/mis-pedidos') || modulo.nombre === 'Mis Pedidos y Cuenta') {
      const estado = !this.mostrarPanelPedidosCliente;
      this.cerrarPanelesLocales();
      this.mostrarPanelPedidosCliente = estado;
      if (this.mostrarPanelPedidosCliente) {
        this.cargarHistorialPedidosCliente();
      }
      this.router.navigate([estado ? '/principal' : '/principal/dashboard']);
      return;
    }

    this.cerrarPanelesLocales();
    if (url) {
      this.router.navigate([url]);
    }
  }

  private cargarDatosPerfilDesdeBD(): void {
    if (!this.usuario?.email) return;

    this.usuarioService.obtenerPerfil(this.usuario.email).subscribe({
      next: (perfil) => {
        if (this.usuario) {
          this.usuario.nombre = perfil.nombre;
          this.usuario.apellido = perfil.apellido;
          this.usuario.names = `${perfil.nombre} ${perfil.apellido}`;
        }
        this.fotoPerfilUrl = perfil.fotoPerfil || null;

        this.formPerfil.patchValue({
          nombre: perfil.nombre,
          apellido: perfil.apellido,
          telefono: perfil.telefono || '',
          preferenciaCategoria: perfil.preferenciaCategoria || 'Vinos Tintos Gran Reserva',
          preferenciaMaridaje: perfil.preferenciaMaridaje || 'Carnes rojas y quesos maduros',
          notifEstadoPedidos: perfil.notifEstadoPedidos ?? true,
          notifPromocionesEmail: perfil.notifPromocionesEmail ?? true,
          notifNuevasCosechas: perfil.notifNuevasCosechas ?? false,
        });
        this.cdr.detectChanges();
      },
    });
  }

  cargarHistorialPedidosCliente(): void {
    if (!this.usuario?.email) return;
    this.http
      .get<any[]>(`${environment.apiUrl}/pedidos/cliente`, {
        params: { email: this.usuario.email },
      })
      .subscribe({
        next: (pedidos) => {
          this.historialPedidosCliente = pedidos;
          this.pageHistorial = 1;
          this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => {
          this.toastService.show(err.error?.message || 'No se pudo obtener el historial de pedidos.', 'warning');
        },
      });
  }

  cargarSucursalesYRoles(): void {
    this.http.get<any[]>(`${environment.apiUrl}/sucursales`).subscribe({
      next: (sucursales) => {
        this.listaSucursales = sucursales;
        this.cdr.detectChanges();
      },
    });
    this.usuarioService.listarRoles().subscribe({
      next: (roles) => {
        this.rolesDisponibles = roles;
        this.cdr.detectChanges();
      },
    });
  }

  crearSucursalDesdeAdmin(): void {
    if (this.formNuevaSucursal.invalid) {
      this.formNuevaSucursal.markAllAsTouched();
      return;
    }

    Swal.fire({
      title: '¿Está seguro de registrar la sucursal?',
      showCancelButton: true,
      cancelButtonText: 'No',
      confirmButtonText: 'Si',
      confirmButtonColor: '#000080',
      cancelButtonColor: '#b5b4b4',
      focusCancel: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.registrarSucursal();
      }
    });
  }

  private registrarSucursal(): void {
    this.guardandoSucursal = true;
    this.cdr.detectChanges();
    const val = this.formNuevaSucursal.value;
    const payload = {
      nombre: val.nombre!.trim(),
      direccion: val.direccion!.trim(),
      telefono: val.telefono?.trim() || null,
    };

    this.http.post<any>(`${environment.apiUrl}/sucursales`, payload).subscribe({
      next: (nueva) => {
        this.guardandoSucursal = false;
        Swal.fire({
          icon: 'success',
          title: 'Registrar sucursal',
          text: `¡Se registró exitosamente la sucursal "${nueva.nombre}"!`,
          confirmButtonColor: '#000080',
        });
        this.formNuevaSucursal.reset();
        this.cargarSucursalesYRoles();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.guardandoSucursal = false;
        Swal.fire({
          icon: 'error',
          title: 'Registrar sucursal',
          text: err.error?.message || '¡Ha ocurrido un error al registrar la sucursal!',
          confirmButtonColor: '#b5b4b4',
        });
        this.cdr.detectChanges();
      },
    });
  }

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

  guardarCambiosPerfil(): void {
    if (this.formPerfil.invalid || !this.usuario) {
      this.formPerfil.markAllAsTouched();
      return;
    }

    this.guardandoPerfil = true;
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
      notifNuevasCosechas: val.notifNuevasCosechas,
    };

    this.usuarioService.actualizarPerfil(payload).subscribe({
      next: (actualizado) => {
        this.guardandoPerfil = false;
        if (this.usuario) {
          this.usuario.nombre = actualizado.nombre;
          this.usuario.apellido = actualizado.apellido;
          this.usuario.names = `${actualizado.nombre} ${actualizado.apellido}`;
        }
        this.fotoPerfilUrl = actualizado.fotoPerfil || null;
        this.toastService.show('Perfil y preferencias actualizados en Neon.', 'success');
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.guardandoPerfil = false;
        this.toastService.show(err.error?.message || 'Error al actualizar el perfil.', 'danger');
        this.cdr.detectChanges();
      },
    });
  }

  cargarRolesYUsuarios(): void {
    this.usuarioService.listarRoles().subscribe({
      next: (roles) => {
        this.rolesDisponibles = roles;
        this.cdr.detectChanges();
      },
    });
    this.usuarioService.listarUsuarios().subscribe({
      next: (usuarios) => {
        this.listaUsuarios = usuarios;
        this.cdr.detectChanges();
      },
    });
  }

  crearUsuarioDesdeAdmin(): void {
    if (this.formNuevoUsuario.invalid) {
      this.formNuevoUsuario.markAllAsTouched();
      return;
    }

    Swal.fire({
      title: '¿Está seguro de registrar los datos del usuario?',
      showCancelButton: true,
      cancelButtonText: 'No',
      confirmButtonText: 'Si',
      confirmButtonColor: '#000080',
      cancelButtonColor: '#b5b4b4',
      focusCancel: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.registrarUsuario();
      }
    });
  }

  private registrarUsuario(): void {
    this.guardandoUsuario = true;
    this.cdr.detectChanges();
    const val = this.formNuevoUsuario.value;
    const payload = {
      nombre: val.nombre,
      apellido: val.apellido,
      dni: val.dni,
      email: val.email,
      telefono: val.telefono || null,
      password: val.password,
      idRol: Number(val.idRol),
    };

    this.usuarioService.crearUsuario(payload).subscribe({
      next: (nuevo) => {
        this.guardandoUsuario = false;
        Swal.fire({
          icon: 'success',
          title: 'Registrar usuario',
          text: `¡Se registró exitosamente el usuario ${nuevo.nombre} (${nuevo.nombreRol})!`,
          confirmButtonColor: '#000080',
        });
        this.formNuevoUsuario.reset();
        this.cargarRolesYUsuarios();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.guardandoUsuario = false;
        Swal.fire({
          icon: 'error',
          title: 'Registrar usuario',
          text: err.error?.message || '¡Ha ocurrido un error al registrar el usuario!',
          confirmButtonColor: '#b5b4b4',
        });
        this.cdr.detectChanges();
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.toastService.show('Sesión cerrada correctamente.', 'info');
    this.router.navigate(['/login']);
  }

  isPasswordUsuarioVisible: boolean = false;

  togglePasswordUsuarioVisibility(): void {
    this.isPasswordUsuarioVisible = !this.isPasswordUsuarioVisible;
  }
}