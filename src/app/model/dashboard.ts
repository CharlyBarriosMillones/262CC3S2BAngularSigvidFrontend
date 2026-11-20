export interface VentaDiariaResponse {
  fecha: string;
  total: number;
  pedidos: number;
}

export interface StockCategoriaResponse {
  categoria: string;
  stockActual: number;
  stockMinimo: number;
}

export interface PedidosEstadoResponse {
  estado: string;
  cantidad: number;
}