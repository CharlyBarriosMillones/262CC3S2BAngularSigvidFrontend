import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Rol } from '../model/rol';
import { Modulo } from '../model/modulo';
import { ObjectResponse } from '../model/api/response/object-response';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly usuariosUrl = `${environment.apiUrl}/usuarios`;
  private readonly rolesUrl = `${environment.apiUrl}/roles`;
  private readonly modulosUrl = `${environment.apiUrl}/modulos`;

  listarUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(this.usuariosUrl);
  }

  crearUsuario(payload: any): Observable<any> {
    return this.http.post<any>(this.usuariosUrl, payload);
  }

  actualizarUsuario(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.usuariosUrl}/${id}`, payload);
  }

  eliminarUsuario(id: number): Observable<ObjectResponse<void>> {
    return this.http.delete<ObjectResponse<void>>(`${this.usuariosUrl}/${id}`);
  }

  obtenerPerfil(email: string): Observable<any> {
    return this.http.get<any>(`${this.usuariosUrl}/perfil`, { params: { email } });
  }

  actualizarPerfil(datos: any): Observable<any> {
    return this.http.put<any>(`${this.usuariosUrl}/perfil`, datos);
  }

  buscarPorDocumento(documento: string): Observable<any> {
    return this.http.get<any>(`${this.usuariosUrl}/buscar-documento/${documento}`);
  }

  listarRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(this.rolesUrl);
  }

  listarModulosPorRol(idRol: number): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(`${this.modulosUrl}/rol/${idRol}`);
  }
}