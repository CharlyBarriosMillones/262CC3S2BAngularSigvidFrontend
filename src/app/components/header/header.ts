import { Component, HostListener, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header implements OnInit {
  isHome = true;
  isScrolled = false;
  mostrarAdvertencia = false;
  mostrarHeader = true;

  private router = inject(Router);
  // pantallas en las que se verá la advertencia
  private rutasConAdvertencia = ['/', '/vinos', '/piscos', '/corchos'];
  // rutas donde no aparece el header
  private rutasInternas = ['/principal', '/login', '/register'];

  ngOnInit() {
    this.actualizarEstadoVista(this.router.url);

    // saber si el usuario cambia de pagina a través del menu
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.actualizarEstadoVista(event.urlAfterRedirects);
    });
  }

  private actualizarEstadoVista(url: string) {
    this.isHome = url === '/';
    this.mostrarAdvertencia = this.rutasConAdvertencia.includes(url);
    this.mostrarHeader = !this.rutasInternas.some(ruta => url.startsWith(ruta));
  }

  // detectar el scroll vertical de la ventana
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50; // se activa tras bajar 50px
  }
}