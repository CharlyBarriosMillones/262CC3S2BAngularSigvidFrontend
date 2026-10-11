import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule,Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-inicio-sesion',
  imports: [ReactiveFormsModule,RouterModule],
  templateUrl: './inicio-sesion.html',
  styleUrl: './inicio-sesion.scss',
})

export class InicioSesion {
  router = inject(Router);
  location = inject(Location);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  login(){
    if(this.form.invalid) return;
    
    const {email, password} = this.form.value;
    if(!email || !password)return;

    alert('Ingreso exitoso')
    this.router.navigate(['/principal']);
  }

  onBack() {
    this.router.navigate(['']);
  }

}
