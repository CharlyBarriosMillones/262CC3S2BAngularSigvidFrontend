export interface RecepcionLineaRequest {
  idDetalle: number;
  cantidadRecibida: number;
}

export interface RecepcionRequest {
  tipo: 'CONFORMIDAD' | 'FIRMA';
  firmaDigital?: string;
  observaciones?: string;
  lineas: RecepcionLineaRequest[];
}