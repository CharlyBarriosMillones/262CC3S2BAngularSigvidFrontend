export interface MetodoPago {
  idMetodo: number;
  nombre: string;
}

export interface Caja {
  idCaja: number;
  nombre: string;
  saldoActual: number;
}

export interface PagoRequest {
  idPedido: number;
  idCajero?: number;
  idMetodo?: number;
  nombreMetodo: string;
  idCaja?: number;
  montoRecibido: number;
  codigoVoucher?: string;
  voucherBase64?: string;
}

export interface PagoResponse {
  idPago: number;
  fecha: string;
  idPedido: number;
  codigoPedido: string;
  estadoPedido: string;
  nombreCliente: string;
  metodoPago: string;
  montoPedido: number;
  montoRecibido: number;
  vuelto: number;
  codigoVoucher?: string;
  tieneVoucherDigital: boolean;
  nuevoSaldoCaja: number;
  notificacionVendedor?: string;
}