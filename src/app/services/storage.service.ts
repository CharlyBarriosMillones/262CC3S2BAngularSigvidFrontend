import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UserSesion } from '../model/user-sesion';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sessionService = inject(SessionService);

  getItem(key: string): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(key);
    }
    return null;
  }

  setItem(key: string, value: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(key, value);
    }
  }

  removeItem(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(key);
    }
  }

  clear(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
    }
  }

  verificarSession(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('user_token');
    }
    return false;
  }

  getUserSession(): UserSesion | null {
    return this.sessionService.getInfoSession();
  }
}