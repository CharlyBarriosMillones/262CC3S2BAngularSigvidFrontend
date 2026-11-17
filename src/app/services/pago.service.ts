import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Caja, MetodoPago, PagoRequest, PagoResponse } from '../model/pago';
import { ObjectResponse } from '../model/api/response/object-response';

@Injectable({
  providedIn: 'root',
})
export class PagoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/pagos`;

  listarPagos(): Observable<PagoResponse[]> {
    return this.http.get<PagoResponse[]>(this.apiUrl);
  }

  listarMetodosPago(): Observable<MetodoPago[]> {
    return this.http.get<MetodoPago[]>(`${this.apiUrl}/metodos`);
  }

  listarCajas(): Observable<Caja[]> {
    return this.http.get<Caja[]>(`${this.apiUrl}/cajas`);
  }

  registrarPago(request: PagoRequest): Observable<ObjectResponse<PagoResponse>> {
    return this.http.post<ObjectResponse<PagoResponse>>(this.apiUrl, request);
  }
}