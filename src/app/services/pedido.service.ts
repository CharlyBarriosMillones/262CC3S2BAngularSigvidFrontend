import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { PedidoRequest, PedidoResponse } from '../model/pedido';
import { ObjectResponse } from '../model/api/response/object-response';

@Injectable({
  providedIn: 'root',
})
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/pedidos`;

  listarPedidos(estado?: string, termino?: string): Observable<PedidoResponse[]> {
    let params = new HttpParams();
    if (estado && estado.trim().length > 0) {
      params = params.set('estado', estado.trim());
    }
    if (termino && termino.trim().length > 0) {
      params = params.set('termino', termino.trim());
    }
    return this.http.get<PedidoResponse[]>(this.apiUrl, { params });
  }

  listarPorCliente(email: string): Observable<PedidoResponse[]> {
    return this.http.get<PedidoResponse[]>(`${this.apiUrl}/cliente`, {
      params: { email },
    });
  }

  registrarPedido(request: PedidoRequest): Observable<ObjectResponse<PedidoResponse>> {
    return this.http.post<ObjectResponse<PedidoResponse>>(this.apiUrl, request);
  }

  derivarAAlmacen(idPedido: number): Observable<ObjectResponse<PedidoResponse>> {
    return this.http.put<ObjectResponse<PedidoResponse>>(`${this.apiUrl}/${idPedido}/derivar-almacen`, {});
  }
}