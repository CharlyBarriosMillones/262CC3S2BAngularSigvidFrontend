import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-inicio-sesion',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './inicio-sesion.html',
  styleUrl: './inicio-sesion.scss',
})

export class InicioSesion implements OnInit {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  errorMessage: string = '';
  successMessage: string = '';
  cargando: boolean = false;

  // controla si se muestra el formulario de recuperacion de contraseña
  modoRecuperacion: boolean = false;

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    recordarSesion: new FormControl(true),
  });

  // formulario para recuperar contraseña validando email y DNI
  formRecuperacion = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    dni: new FormControl('', [Validators.required, Validators.pattern(/^\d{8}$/)]),
    nuevaPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  ngOnInit(): void {
    // inicio de sesi, si ya esta activa redirige a /principal
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/principal']);
    }
  }

  login() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.value;
    if (!email || !password) return;

    this.errorMessage = '';
    this.successMessage = '';
    this.cargando = true;
    this.cdr.detectChanges();

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.cargando = false;
        this.cdr.detectChanges();
        this.router.navigate(['/principal']);
      },
      error: (err) => {
        this.cargando = false;
        // captura el mensaje enviado por GlobalExceptionHandler del backend
        this.errorMessage = err.error?.message || 'Error al conectar con el servidor. Verifica tus credenciales.';
        // fuerza a actualizar la vista inmediatamente 
        this.cdr.detectChanges();
      }
    });
  }

  // alterna entre vista de login y vista de recuperacion de contraseña 
  toggleRecuperacion() {
    this.modoRecuperacion = !this.modoRecuperacion;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();
  }

  recuperarPassword() {
    if (this.formRecuperacion.invalid) {
      this.formRecuperacion.markAllAsTouched();
      return;
    }

    const { email, dni, nuevaPassword } = this.formRecuperacion.value;
    if (!email || !dni || !nuevaPassword) return;

    this.cargando = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    this.authService.recuperarPassword({ email, dni, nuevaPassword }).subscribe({
      next: () => {
        this.cargando = false;
        this.successMessage = `La contraseña para ${email} fue actualizada en la base de datos. Ya puedes iniciar sesión.`;
        this.formRecuperacion.reset();
        this.modoRecuperacion = false;
        this.form.patchValue({ email, password: '' });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.errorMessage = err.error?.message || 'No se pudo restablecer la contraseña. Verifica que el correo y DNI coincidan.';
        this.cdr.detectChanges();
      }
    });
  }

  onBack() {
    this.router.navigate(['']);
  }
}