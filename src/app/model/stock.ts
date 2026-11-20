export interface Ubigeo {
  idUbigeo: string;
  departamento: string;
  provincia: string;
  distrito: string;
}

export interface AlmacenResponse {
  idAlmacen: number;
  nombre: string;
  direccion: string;
  idUbigeo?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
}

export interface StockResponse {
  idStock: number;
  idProducto: number;
  codigoProducto: string;
  nombreProducto: string;
  nombreCategoria?: string;
  nombreMarca?: string;
  idAlmacen: number;
  nombreAlmacen: string;
  idUbigeo?: string;
  ubicacion?: string;
  cantidadActual: number;
  stockMinimo: number;
  estado: string;
  fechaUltimaConfirmacion?: string;
  usuarioConfirma?: string;
  mensaje?: string;
}