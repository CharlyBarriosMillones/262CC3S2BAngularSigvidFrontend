export interface DetalleGuiaResponse {
  idDetalle: number;
  idProducto: number;
  codigoProducto: string;
  nombreProducto: string;
  cantidadSolicitada: number;
  cantidadAsignada: number;
  codigoQr?: string;
  escaneado: boolean;
  cantidadRecibida?: number;
}

export interface GuiaDespachoResponse {
  idGuia: number;
  codigoGuia: string;
  estadoGuia: string;
  fechaGeneracion: string;
  fechaSalida?: string;
  idAlmacen: number;
  nombreAlmacen: string;
  nombreTrabajador: string;
  idPedido: number;
  codigoPedido: string;
  estadoPedido: string;
  nombreCliente: string;
  dniCliente: string;
  totalItems: number;
  itemsEscaneados: number;
  notificacion?: string;
  detalles: DetalleGuiaResponse[];
}

export interface LineaPedidoAlmacen {
  idProducto: number;
  codigoProducto: string;
  nombreProducto: string;
  cantidadSolicitada: number;
  stockDisponible: number;
  cantidadSugerida: number;
  stockSuficiente: boolean;
}

export interface PedidoAlmacenDetalleResponse {
  idPedido: number;
  codigoPedido: string;
  estado: string;
  nombreCliente: string;
  dniCliente: string;
  nombreSucursal: string;
  idAlmacen: number;
  nombreAlmacen: string;
  lineas: LineaPedidoAlmacen[];
}

export interface AsignacionRequest {
  idAlmacen: number;
  lineas: {
    idProducto: number;
    cantidadAsignada: number;
  }[];
}