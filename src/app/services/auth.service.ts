import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { UserRequest } from '../model/api/request/user-request';
import { RegisterRequest } from '../model/api/request/register-request';
import { UserResponse } from '../model/api/response/user-response';
import { UserSesion } from '../model/user-sesion';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authUrl = `${environment.apiUrl}/auth`;
  private readonly usuariosUrl = `${environment.apiUrl}/usuarios`;

  private readonly TOKEN_KEY = 'sigvid_token';
  private readonly USER_KEY = 'sigvid_user';

  login(credentials: UserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.authUrl}/login`, credentials).pipe(
      tap((response) => this.guardarSesion(response))
    );
  }

  register(datos: RegisterRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.authUrl}/register`, datos).pipe(
      tap((response) => this.guardarSesion(response))
    );
  }

  // actualizar la contraseña
  recuperarPassword(datos: { email: string; dni: string; nuevaPassword: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.authUrl}/recuperar-password`, datos);
  }

  // obtener datos de perfil, foto y preferencias
  obtenerPerfil(email: string): Observable<any> {
    return this.http.get<any>(`${this.usuariosUrl}/perfil`, { params: { email } });
  }

  // guardar la edicion de datos del perfil
  actualizarPerfil(datos: any): Observable<any> {
    return this.http.put<any>(`${this.usuariosUrl}/perfil`, datos).pipe(
      tap((actualizado) => {
        const sesionActual = this.getUsuarioActual();
        if (sesionActual) {
          sesionActual.nombre = actualizado.nombre;
          sesionActual.apellido = actualizado.apellido;
          localStorage.setItem(this.USER_KEY, JSON.stringify(sesionActual));
        }
      })
    );
  }

  private guardarSesion(response: UserResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    const sesion: UserSesion = {
      email: response.email,
      nombre: response.nombre,
      apellido: response.apellido,
      rol: response.rol
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(sesion));
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUsuarioActual(): UserSesion | null {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}