import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';
import { ToastService } from '../services/toast.service';

export const moduloGuard: CanActivateFn = (route, state) => {
  const sessionService = inject(SessionService);
  const toastService = inject(ToastService);
  const router = inject(Router);

  const session = sessionService.getInfoSession();
  if (!session || !session.modulos) {
    return router.createUrlTree(['/login']);
  }

  const childPath = route.routeConfig?.path || '';
  if (childPath === 'dashboard') {
    return true;
  }

  const currentUrl = state.url;
  const hasAccess = session.modulos.some(
    (modulo) =>
      (modulo.activo ?? true) &&
      (currentUrl.includes(modulo.url) || (childPath !== '' && modulo.url.endsWith('/' + childPath)))
  );

  if (hasAccess) {
    return true;
  }

  toastService.show('No tienes permisos para acceder a este módulo.', 'warning');
  return router.createUrlTree(['/principal/dashboard']);
};