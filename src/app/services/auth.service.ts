import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { UserRequest } from '../model/api/request/user-request';
import { RegisterRequest } from '../model/api/request/register-request';
import { UserResponse } from '../model/api/response/user-response';
import { ObjectResponse } from '../model/api/response/object-response';
import { UserSesion } from '../model/user-sesion';
import { StorageService } from './storage.service';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storageService = inject(StorageService);
  private readonly sessionService = inject(SessionService);

  private readonly authUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'user_token';

  private readonly _isLoggedIn = signal<boolean>(this.hasToken());
  isLoggedInSignal = this._isLoggedIn.asReadonly();

  login(credentials: UserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.authUrl}/login`, credentials).pipe(
      tap((response) => this.setToken(response.token))
    );
  }

  register(datos: RegisterRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.authUrl}/register`, datos).pipe(
      tap((response) => this.setToken(response.token))
    );
  }

  recuperarPassword(datos: { email: string; dni: string; nuevaPassword: string }): Observable<ObjectResponse<void>> {
    return this.http.post<ObjectResponse<void>>(`${this.authUrl}/recuperar-password`, datos);
  }

  private hasToken(): boolean {
    return !!this.storageService.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    this.storageService.setItem(this.TOKEN_KEY, token);
    this._isLoggedIn.set(true);
  }

  getToken(): string | null {
    return this.storageService.getItem(this.TOKEN_KEY);
  }

  getUsuarioActual(): UserSesion | null {
    return this.sessionService.getInfoSession();
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }

  logout(): void {
    this.storageService.removeItem(this.TOKEN_KEY);
    this._isLoggedIn.set(false);
  }
}