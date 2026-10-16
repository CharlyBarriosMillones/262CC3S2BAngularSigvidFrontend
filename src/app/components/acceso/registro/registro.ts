import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { RegisterRequest } from '../../../model/api/request/register-request';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './registro.html',
  styleUrl: './registro.scss'
})
export class Registro {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  errorMessage: string = '';
  cargando: boolean = false;
  mostrarDatosEmpresa: boolean = false;

  // variables para la verificacion del email mediante correo electronico
  pasoVerificacionEmail: boolean = false;
  codigoGenerado: string = '';
  codigoIngresado = new FormControl('', [Validators.required, Validators.minLength(6)]);

  form = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.maxLength(50)]),
    apellido: new FormControl('', [Validators.required, Validators.maxLength(50)]),
    dni: new FormControl('', [Validators.required, Validators.pattern(/^\d{8}$/)]),
    telefono: new FormControl('', [Validators.pattern(/^\d{7,15}$/)]),
    email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(100)]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    ruc: new FormControl('', [Validators.pattern(/^\d{11}$/)]),
    razonSocial: new FormControl('', [Validators.maxLength(150)]),
    direccion: new FormControl('')
  });

  toggleDatosEmpresa(): void {
    this.mostrarDatosEmpresa = !this.mostrarDatosEmpresa;
  }

  // generar codigo de verificacion de correo electronico antes de guardar
  iniciarVerificacionEmail(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.codigoGenerado = Math.floor(100000 + Math.random() * 900000).toString();
    this.codigoIngresado.reset('');
    this.pasoVerificacionEmail = true;
    this.cdr.detectChanges();
  }

  // confirmar el codigo enviado al correo y registrar en Neon
  confirmarCodigoYRegistrar(): void {
    if (this.codigoIngresado.value?.trim() !== this.codigoGenerado) {
      this.errorMessage = 'El código de verificación ingresado es incorrecto.';
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

    // enviamos undefined en campos opcionales vacios para respetar UNIQUE en la BD
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
      direccion: val.direccion?.trim() ? val.direccion.trim() : undefined
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.cargando = false;
        this.cdr.detectChanges();
        this.router.navigate(['/principal']);
      },
      error: (err) => {
        this.cargando = false;
        this.errorMessage = err.error?.message || 'No se pudo completar el registro. Verifica que el DNI o correo no estén duplicados.';
        this.cdr.detectChanges();
      }
    });
  }
}