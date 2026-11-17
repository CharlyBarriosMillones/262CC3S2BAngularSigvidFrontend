import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Categoria, Marca, Producto } from '../model/producto';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/productos`;

  listarProductos(idCategoria?: number | null, idMarca?: number | null, busqueda?: string): Observable<Producto[]> {
    let params = new HttpParams();
    if (idCategoria) {
      params = params.set('idCategoria', idCategoria.toString());
    }
    if (idMarca) {
      params = params.set('idMarca', idMarca.toString());
    }
    if (busqueda && busqueda.trim().length > 0) {
      params = params.set('busqueda', busqueda.trim());
    }
    return this.http.get<Producto[]>(this.apiUrl, { params });
  }

  listarCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/categorias`);
  }

  listarMarcas(): Observable<Marca[]> {
    return this.http.get<Marca[]>(`${this.apiUrl}/marcas`);
  }

  guardarProducto(producto: Partial<Producto>): Observable<Producto> {
    return this.http.post<Producto>(`${this.apiUrl}/save`, producto);
  }
}