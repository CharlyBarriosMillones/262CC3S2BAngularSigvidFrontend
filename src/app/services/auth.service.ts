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