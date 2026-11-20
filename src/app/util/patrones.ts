export const Patrones = {
  NOMBRE: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]{2,50}$/,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  DNI: /^\d{8}$/,
  RUC: /^(10|15|17|20)\d{9}$/,
  TELEFONO: /^\d{7,15}$/,
  CODIGO_PRODUCTO: /^[A-Z]{3}-\d{3}$/,
  CODIGO_VOUCHER: /^[A-Za-z0-9-]{4,30}$/,
  TEXTO_SEGURO: /^[^<>]*$/,
  DNI_O_RUC: /^(\d{8}|(10|15|17|20)\d{9})$/,
  METODO_PAGO: /^(Efectivo|Tarjeta|Transferencia)$/i,
  TIPO_DESCUENTO: /^(PORCENTAJE|MONTO_FIJO)$/i,
  BUSQUEDA: /^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñÜü' -]{0,50}$/,
  TIPO_RECEPCION: /^(CONFORMIDAD|FIRMA)$/,
  FIRMA_PNG: /^data:image\/png;base64,[A-Za-z0-9+/=]+$/,
  CODIGO_VERIFICACION: /^\d{6}$/,
  ENTERO: /^\d+$/,
} as const;

export const Limites = {
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 64,
  EMAIL_MAX: 100,
  CANTIDAD_MIN: 1,
  CANTIDAD_MAX: 10000,
  BUSQUEDA_MAX: 50,
} as const;