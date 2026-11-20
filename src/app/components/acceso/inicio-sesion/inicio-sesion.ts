import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { Limites, Patrones } from '../../../util/patrones';
import { RegexConstants } from '../../../util/constant';

@Component({
  selector: 'app-inicio-sesion',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './inicio-sesion.html',
  styleUrl: './inicio-sesion.scss',
})
export class InicioSesion implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  public RG = RegexConstants;

  errorMessage: string = '';
  successMessage: string = '';
  cargando: boolean = false;
  modoRecuperacion: boolean = false;

  form = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email,
      Validators.pattern(Patrones.EMAIL),
      Validators.maxLength(Limites.EMAIL_MAX),
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(Limites.PASSWORD_MIN),
      Validators.maxLength(Limites.PASSWORD_MAX),
    ]),
    recordarSesion: new FormControl(true),
  });

  formRecuperacion = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email,
      Validators.pattern(Patrones.EMAIL),
      Validators.maxLength(Limites.EMAIL_MAX),
    ]),
    dni: new FormControl('', [Validators.required, Validators.pattern(Patrones.DNI)]),
    nuevaPassword: new FormControl('', [
      Validators.required,
      Validators.minLength(Limites.PASSWORD_MIN),
      Validators.maxLength(Limites.PASSWORD_MAX),
    ]),
  });

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/principal/dashboard']);
    }
  }

  login(): void {
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
      next: (res) => {
        this.cargando = false;
        this.toastService.show(`Bienvenido(a), ${res.nombre} (${res.rol})`, 'success');
        this.cdr.detectChanges();
        this.router.navigate(['/principal/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        const msg = err.error?.message || 'Credenciales incorrectas o usuario no encontrado.';
        this.errorMessage = msg;
        this.toastService.show(msg, 'danger');
        this.cdr.detectChanges();
      },
    });
  }

  toggleRecuperacion(): void {
    this.modoRecuperacion = !this.modoRecuperacion;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();
  }

  recuperarPassword(): void {
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
      next: (res) => {
        this.cargando = false;
        const msg = res.message || `La contraseña para ${email} fue actualizada correctamente.`;
        this.successMessage = msg;
        this.toastService.show(msg, 'success');
        this.formRecuperacion.reset();
        this.modoRecuperacion = false;
        this.form.patchValue({ email, password: '' });
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        const msg = err.error?.message || 'No se pudo restablecer la contraseña. Verifica correo y DNI.';
        this.errorMessage = msg;
        this.toastService.show(msg, 'danger');
        this.cdr.detectChanges();
      },
    });
  }

  onBack(): void {
    this.router.navigate(['']);
  }

  isPasswordVisible: boolean = false;
  isNuevaPasswordVisible: boolean = false;

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  toggleNuevaPasswordVisibility(): void {
    this.isNuevaPasswordVisible = !this.isNuevaPasswordVisible;
  }
}