import { Component, HostListener, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { SessionService } from '../../services/session.service';
import { UserSesion } from '../../model/user-sesion';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  isHome = true;
  isScrolled = false;
  mostrarAdvertencia = false;
  mostrarHeader = true;
  usuarioSesion: UserSesion | null = null;

  private readonly router = inject(Router);
  private readonly sessionService = inject(SessionService);

  private readonly rutasConAdvertencia = ['/', '/vinos', '/piscos', '/corchos'];
  private readonly rutasInternas = ['/principal', '/login', '/register'];

  ngOnInit(): void {
    this.actualizarEstadoVista(this.router.url);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.actualizarEstadoVista(event.urlAfterRedirects);
      });
  }

  private actualizarEstadoVista(url: string): void {
    this.isHome = url === '/';
    this.mostrarAdvertencia = this.rutasConAdvertencia.includes(url);
    this.mostrarHeader = !this.rutasInternas.some((ruta) => url.startsWith(ruta));
    this.usuarioSesion = this.sessionService.getInfoSession();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }
}