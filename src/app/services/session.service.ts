import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UserSesion } from '../model/user-sesion';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly TOKEN_KEY = 'user_token';

  private getDecodedToken(): any | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      return null;
    }
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const binary = atob(base64);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const decodedTokenString = new TextDecoder('utf-8').decode(bytes);
      return JSON.parse(decodedTokenString);
    } catch {
      return null;
    }
  }

  getInfoSession(): UserSesion | null {
    const decoded = this.getDecodedToken();
    if (!decoded) {
      return null;
    }
    return {
      usuarioId: decoded.usuarioId || 0,
      email: decoded.email || decoded.sub || '',
      names: decoded.names || `${decoded.nombre || ''} ${decoded.apellido || ''}`.trim(),
      nombre: decoded.nombre || '',
      apellido: decoded.apellido || '',
      rol: decoded.rol || decoded.role?.nombre || 'Cliente',
      role: decoded.role,
      modulos: decoded.modules || [],
    };
  }
}