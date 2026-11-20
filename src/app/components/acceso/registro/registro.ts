import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { RegisterRequest } from '../../../model/api/request/register-request';
import { Limites, Patrones } from '../../../util/patrones';
import { RegexConstants } from '../../../util/constant';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class Registro {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  public RG = RegexConstants;

  errorMessage: string = '';
  cargando: boolean = false;
  mostrarDatosEmpresa: boolean = false;

  pasoVerificacionEmail: boolean = false;
  codigoGenerado: string = '';
  codigoIngresado = new FormControl('', [Validators.required, Validators.pattern(Patrones.CODIGO_VERIFICACION)]);

  form = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.maxLength(50), Validators.pattern(Patrones.NOMBRE)]),
    apellido: new FormControl('', [Validators.required, Validators.maxLength(50), Validators.pattern(Patrones.NOMBRE)]),
    dni: new FormControl('', [Validators.required, Validators.pattern(Patrones.DNI)]),
    telefono: new FormControl('', [Validators.pattern(Patrones.TELEFONO)]),
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
    ruc: new FormControl('', [Validators.pattern(Patrones.RUC)]),
    razonSocial: new FormControl('', [Validators.maxLength(150), Validators.pattern(Patrones.TEXTO_SEGURO)]),
    direccion: new FormControl('', [Validators.pattern(Patrones.TEXTO_SEGURO)]),
  });

  toggleDatosEmpresa(): void {
    this.mostrarDatosEmpresa = !this.mostrarDatosEmpresa;
  }

  iniciarVerificacionEmail(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.codigoGenerado = Math.floor(100000 + Math.random() * 900000).toString();
    this.codigoIngresado.reset('');
    this.pasoVerificacionEmail = true;
    this.toastService.show(`Código de verificación enviado: ${this.codigoGenerado}`, 'info');
    this.cdr.detectChanges();
  }

  confirmarCodigoYRegistrar(): void {
    if (this.codigoIngresado.value?.trim() !== this.codigoGenerado) {
      this.errorMessage = 'El código de verificación ingresado es incorrecto.';
      this.toastService.show(this.errorMessage, 'danger');
      this.cdr.detectChanges();
      return;
    }

    this.registrar();
  }

  registrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    if (!val.nombre || !val.apellido || !val.dni || !val.email || !val.password) return;

    this.errorMessage = '';
    this.cargando = true;
    this.cdr.detectChanges();

    const payload: RegisterRequest = {
      nombre: val.nombre.trim(),
      apellido: val.apellido.trim(),
      dni: val.dni.trim(),
      email: val.email.trim(),
      telefono: val.telefono?.trim() ? val.telefono.trim() : undefined,
      password: val.password,
      tipoUsuario: 'CLIENTE',
      nombreRol: 'Cliente',
      ruc: val.ruc?.trim() ? val.ruc.trim() : undefined,
      razonSocial: val.razonSocial?.trim() ? val.razonSocial.trim() : undefined,
      direccion: val.direccion?.trim() ? val.direccion.trim() : undefined,
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.cargando = false;
        this.toastService.show(`Cuenta creada exitosamente. ¡Bienvenido(a), ${res.nombre}!`, 'success');
        this.cdr.detectChanges();
        this.router.navigate(['/principal/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        const msg = err.error?.message || 'No se pudo completar el registro. Verifica DNI o correo.';
        this.errorMessage = msg;
        this.toastService.show(msg, 'danger');
        this.cdr.detectChanges();
      },
    });
  }

  isPasswordVisible: boolean = false;

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}