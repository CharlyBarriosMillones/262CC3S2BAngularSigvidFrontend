import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { AlmacenResponse, StockResponse, Ubigeo } from '../model/stock';
import { ObjectResponse } from '../model/api/response/object-response';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  consultarStock(filtros?: {
    termino?: string | null;
    idCategoria?: number | null;
    idAlmacen?: number | null;
    idUbigeo?: string | null;
    estado?: string | null;
  }): Observable<StockResponse[]> {
    let params = new HttpParams();
    if (filtros?.termino && filtros.termino.trim().length > 0) {
      params = params.set('termino', filtros.termino.trim());
    }
    if (filtros?.idCategoria) {
      params = params.set('idCategoria', filtros.idCategoria.toString());
    }
    if (filtros?.idAlmacen) {
      params = params.set('idAlmacen', filtros.idAlmacen.toString());
    }
    if (filtros?.idUbigeo) {
      params = params.set('idUbigeo', filtros.idUbigeo);
    }
    if (filtros?.estado) {
      params = params.set('estado', filtros.estado);
    }
    return this.http.get<StockResponse[]>(`${this.apiUrl}/stock`, { params });
  }

  confirmarStock(idStock: number): Observable<ObjectResponse<StockResponse>> {
    return this.http.put<ObjectResponse<StockResponse>>(`${this.apiUrl}/stock/${idStock}/confirmar`, {});
  }

  listarAlmacenes(): Observable<AlmacenResponse[]> {
    return this.http.get<AlmacenResponse[]>(`${this.apiUrl}/almacenes`);
  }

  listarUbigeos(): Observable<Ubigeo[]> {
    return this.http.get<Ubigeo[]>(`${this.apiUrl}/ubigeos`);
  }
}