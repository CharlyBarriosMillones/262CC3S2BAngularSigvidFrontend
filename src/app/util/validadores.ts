import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Patrones } from './patrones';

// valida que el numero sea estrictamente mayor que cero
export const mayorQueCero: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor = control.value;
  if (valor === null || valor === undefined || valor === '') return null;
  return Number(valor) > 0 ? null : { mayorQueCero: true };
};

// acepta un dni (8 digitos) o un ruc (11 digitos con prefijo valido)
export const dniORuc: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor = (control.value ?? '').toString().trim();
  if (!valor) return null;
  return Patrones.DNI_O_RUC.test(valor) ? null : { dniORuc: true };
};