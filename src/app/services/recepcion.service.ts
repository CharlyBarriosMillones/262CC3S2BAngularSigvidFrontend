import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { GuiaDespachoResponse } from '../model/guia-despacho';
import { RecepcionRequest } from '../model/recepcion';
import { ObjectResponse } from '../model/api/response/object-response';

@Injectable({
  providedIn: 'root',
})
export class RecepcionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/recepcion`;

  listarPedidosEnTransito(): Observable<GuiaDespachoResponse[]> {
    return this.http.get<GuiaDespachoResponse[]>(`${this.apiUrl}/pedidos`);
  }

  confirmarRecepcion(
    idPedido: number,
    request: RecepcionRequest
  ): Observable<ObjectResponse<GuiaDespachoResponse>> {
    return this.http.post<ObjectResponse<GuiaDespachoResponse>>(
      `${this.apiUrl}/pedidos/${idPedido}/confirmar`,
      request
    );
  }
}