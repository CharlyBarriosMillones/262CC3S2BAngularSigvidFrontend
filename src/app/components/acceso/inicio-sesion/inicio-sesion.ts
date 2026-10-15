import { ChangeDetectorRef, Component, inject } from '@angular/core';
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

export class InicioSesion {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  errorMessage: string = '';
  cargando: boolean = false;

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  login() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.value;
    if (!email || !password) return;

    this.errorMessage = '';
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

  onBack() {
    this.router.navigate(['']);
  }
}