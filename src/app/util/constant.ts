import { AbstractControl } from '@angular/forms';

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export class RegexConstants {
  private static sanitize(event: Event, regex: RegExp, control?: AbstractControl | null): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target) return;
    const limpio = target.value.replace(regex, '');
    if (target.value !== limpio) {
      target.value = limpio;
      control?.setValue(limpio, { emitEvent: false });
    }
  }

  /** Solo dígitos (DNI, RUC, teléfono, código de verificación) */
  static number(event: Event, control?: AbstractControl | null): void {
    this.sanitize(event, /\D/g, control);
  }

  /** Solo letras, tildes, ñ, espacios, apóstrofo y guion (Nombres y Apellidos) */
  static name(event: Event, control?: AbstractControl | null): void {
    this.sanitize(event, /[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, control);
  }

  /** Texto general seguro sin etiquetas HTML (< >) */
  static text(event: Event, control?: AbstractControl | null): void {
    this.sanitize(event, /[<>]/g, control);
  }

  /** Direcciones seguras */
  static address(event: Event, control?: AbstractControl | null): void {
    this.sanitize(event, /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\-,.#/]/g, control);
  }

  /** Solo caracteres válidos para correo electrónico */
  static email(event: Event, control?: AbstractControl | null): void {
    this.sanitize(event, /[^\w@.\-+]/g, control);
  }

  /** Buscadores de texto/código */
  static search(event: Event, control?: AbstractControl | null): void {
    this.sanitize(event, /[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñÜü' -]/g, control);
  }

  /** Código de voucher (alfanumérico y guiones) */
  static voucher(event: Event, control?: AbstractControl | null): void {
    this.sanitize(event, /[^A-Za-z0-9-]/g, control);
  }
}