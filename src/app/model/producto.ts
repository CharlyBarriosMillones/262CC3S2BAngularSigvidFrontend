export interface Categoria {
  idCategoria: number;
  nombre: string;
}

export interface Marca {
  idMarca: number;
  nombre: string;
}

export interface Producto {
  idProducto: number;
  codigoProducto: string;
  nombre: string;
  precioReferencial: number;
  stockMinimo: number;
  idCategoria: number;
  nombreCategoria: string;
  idMarca: number;
  nombreMarca: string;
  idProveedor?: number;
  razonSocialProveedor?: string;
  cepa?: string;
  descripcion?: string;
  maridaje?: string;
  imagenUrl?: string;
  activo?: boolean;
}