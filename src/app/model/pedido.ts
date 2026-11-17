export interface LineaPedidoRequest {
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
  descuentoLinea?: number;
}

export interface LineaPedidoResponse {
  idLinea: number;
  idProducto: number;
  codigoProducto: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  descuentoLinea: number;
  subtotal: number;
}

export interface PedidoRequest {
  idCliente?: number;
  documentoCliente: string;
  clienteRuc?: string;
  idVendedor?: number;
  idSucursal?: number;
  tipoDescuento: 'PORCENTAJE' | 'MONTO_FIJO';
  valorDescuento: number;
  emitirFacturaElectronica: boolean;
  lineas: LineaPedidoRequest[];
}

export interface PedidoResponse {
  idPedido: number;
  codigoPedido: string;
  fechaSolicitud: string;
  fechaPago?: string;
  fechaEntrega?: string;
  subtotalBruto: number;
  descuento: number;
  importeTotal: number;
  idEstado: number;
  estado: string;
  idSucursal: number;
  nombreSucursal: string;
  idCliente: number;
  nombreCliente: string;
  dniCliente: string;
  idVendedor: number;
  nombreVendedor: string;
  codigoFactura?: string;
  clienteRuc?: string;
  sunatEstado?: string;
  notificacionAlmacen?: string;
  lineas: LineaPedidoResponse[];
}