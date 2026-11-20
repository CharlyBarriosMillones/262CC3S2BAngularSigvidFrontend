import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { PedidoResponse } from '../model/pedido';
import {
  AsignacionRequest,
  GuiaDespachoResponse,
  PedidoAlmacenDetalleResponse,
} from '../model/guia-despacho';
import { ObjectResponse } from '../model/api/response/object-response';

@Injectable({
  providedIn: 'root',
})
export class AlmacenService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/almacen`;

  listarPedidosPendientes(): Observable<PedidoResponse[]> {
    return this.http.get<PedidoResponse[]>(`${this.apiUrl}/pedidos-pendientes`);
  }

  obtenerDetallePedido(idPedido: number, idAlmacen?: number | null): Observable<PedidoAlmacenDetalleResponse> {
    let params = new HttpParams();
    if (idAlmacen) {
      params = params.set('idAlmacen', idAlmacen.toString());
    }
    return this.http.get<PedidoAlmacenDetalleResponse>(`${this.apiUrl}/pedidos/${idPedido}/detalle`, { params });
  }

  asignarProductos(idPedido: number, request: AsignacionRequest): Observable<ObjectResponse<GuiaDespachoResponse>> {
    return this.http.post<ObjectResponse<GuiaDespachoResponse>>(
      `${this.apiUrl}/pedidos/${idPedido}/asignar`,
      request
    );
  }

  listarGuias(estado?: string): Observable<GuiaDespachoResponse[]> {
    let params = new HttpParams();
    if (estado && estado.trim().length > 0) {
      params = params.set('estado', estado.trim());
    }
    return this.http.get<GuiaDespachoResponse[]>(`${this.apiUrl}/guias`, { params });
  }

  obtenerGuia(idGuia: number): Observable<GuiaDespachoResponse> {
    return this.http.get<GuiaDespachoResponse>(`${this.apiUrl}/guias/${idGuia}`);
  }

  registrarEscaneo(
    idGuia: number,
    idDetalle: number,
    codigoQr?: string
  ): Observable<ObjectResponse<GuiaDespachoResponse>> {
    const body = codigoQr ? { codigoQr } : {};
    return this.http.put<ObjectResponse<GuiaDespachoResponse>>(
      `${this.apiUrl}/guias/${idGuia}/detalles/${idDetalle}/escanear`,
      body
    );
  }

  confirmarSalida(idGuia: number): Observable<ObjectResponse<GuiaDespachoResponse>> {
    return this.http.post<ObjectResponse<GuiaDespachoResponse>>(
      `${this.apiUrl}/guias/${idGuia}/confirmar-salida`,
      {}
    );
  }
}