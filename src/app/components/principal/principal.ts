import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SessionService } from '../../services/session.service';
import { UsuarioService } from '../../services/usuario.service';
import { ToastService } from '../../services/toast.service';
import { UserSesion } from '../../model/user-sesion';
import { Modulo } from '../../model/modulo';
import { Rol } from '../../model/rol';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
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

  usuario: UserSesion | null = null;
  modulos: Modulo[] = [];
  moduloActivoUrl: string = '';
  tituloPanel: string = 'Panel de Gestión Vitivinícola';
  descripcionPanel: string = 'Selecciona una opción del menú dinámico habilitada para tu perfil de usuario.';

  // Paneles de Sprint 1 (HU01, HU02 y Administración)
  mostrarPanelUsuarios = false;
  mostrarPanelPerfil = false;
  mostrarPanelPedidosCliente = false;

  rolesDisponibles: Rol[] = [];
  listaUsuarios: any[] = [];
  historialPedidosCliente: any[] = [];
  fotoPerfilUrl: string | null = null;
  guardandoUsuario = false;
  guardandoPerfil = false;

  formPerfil = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    apellido: new FormControl('', [Validators.required]),
    telefono: new FormControl(''),
    preferenciaCategoria: new FormControl('Vinos Tintos Gran Reserva'),
    preferenciaMaridaje: new FormControl('Carnes rojas y quesos maduros'),
    notifEstadoPedidos: new FormControl(true),
    notifPromocionesEmail: new FormControl(true),
    notifNuevasCosechas: new FormControl(false),
  });

  formNuevoUsuario = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    apellido: new FormControl('', [Validators.required]),
    dni: new FormControl('', [Validators.required, Validators.pattern(/^\d{8}$/)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    telefono: new FormControl(''),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    idRol: new FormControl<number | null>(null, [Validators.required]),
  });

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Ítem 1.f: Leemos usuario y módulos dinámicos directamente del token JWT mediante SessionService
    this.usuario = this.sessionService.getInfoSession();
    if (!this.usuario) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    this.tituloPanel = `Panel de ${this.usuario.rol}`;
    this.modulos = this.usuario.modulos || [];

    // Si el token no trajo módulos (por ejemplo, antes de correr el SQL), consulta al endpoint por idRol
    if (this.modulos.length === 0 && this.usuario.role?.idRol) {
      this.usuarioService.listarModulosPorRol(this.usuario.role.idRol).subscribe({
        next: (mods) => {
          this.modulos = mods;
          this.cdr.detectChanges();
        },
      });
    }

    this.cargarDatosPerfilDesdeBD();
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
  }

  abrirModulo(modulo: Modulo): void {
    const url = modulo.url || '';
    this.moduloActivoUrl = url;

    if (url.endsWith('/perfil') || modulo.nombre === 'Mi Perfil y Preferencias') {
      const estado = !this.mostrarPanelPerfil;
      this.cerrarPanelesLocales();
      this.mostrarPanelPerfil = estado;
      this.router.navigate(['/principal']);
      return;
    }

    if (url.endsWith('/usuarios') || modulo.nombre === 'Usuarios y Personal') {
      const estado = !this.mostrarPanelUsuarios;
      this.cerrarPanelesLocales();
      this.mostrarPanelUsuarios = estado;
      if (this.mostrarPanelUsuarios) {
        this.cargarRolesYUsuarios();
      }
      this.router.navigate(['/principal']);
      return;
    }

    if (url.endsWith('/mis-pedidos') || modulo.nombre === 'Mis Pedidos y Cuenta') {
      const estado = !this.mostrarPanelPedidosCliente;
      this.cerrarPanelesLocales();
      this.mostrarPanelPedidosCliente = estado;
      if (this.mostrarPanelPedidosCliente) {
        this.cargarHistorialPedidosCliente();
      }
      this.router.navigate(['/principal']);
      return;
    }

    // Si es una ruta hija de Sprint 2 (Catálogo, Registrar Pedido, Registrar Pago, Derivar a Almacén)
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
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastService.show('No se pudo obtener el historial de pedidos.', 'warning');
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
      error: (err) => {
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

    this.guardandoUsuario = true;
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
        this.toastService.show(`Usuario ${nuevo.nombre} (${nuevo.nombreRol}) registrado en Neon.`, 'success');
        this.formNuevoUsuario.reset();
        this.cargarRolesYUsuarios();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.guardandoUsuario = false;
        this.toastService.show(err.error?.message || 'Error al registrar el usuario.', 'danger');
        this.cdr.detectChanges();
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.toastService.show('Sesión cerrada correctamente.', 'info');
    this.router.navigate(['/login']);
  }
}