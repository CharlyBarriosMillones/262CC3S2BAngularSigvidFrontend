import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  PedidosEstadoResponse,
  StockCategoriaResponse,
  VentaDiariaResponse,
} from '../model/dashboard';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  ventasDiarias(dias: number = 30): Observable<VentaDiariaResponse[]> {
    const params = new HttpParams().set('dias', dias.toString());
    return this.http.get<VentaDiariaResponse[]>(`${this.apiUrl}/ventas-diarias`, { params });
  }

  stockPorCategoria(): Observable<StockCategoriaResponse[]> {
    return this.http.get<StockCategoriaResponse[]>(`${this.apiUrl}/stock-categoria`);
  }

  pedidosPorEstado(): Observable<PedidosEstadoResponse[]> {
    return this.http.get<PedidosEstadoResponse[]>(`${this.apiUrl}/pedidos-estado`);
  }
}