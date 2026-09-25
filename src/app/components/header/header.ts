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
  private router = inject(Router);

  ngOnInit() {
    // verificar si estamos en la portada al cargar la pagina
    this.isHome = this.router.url === '/';

    // saber si el usuario cambia de pagina a través del menu
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isHome = event.urlAfterRedirects === '/';
    });
  }

  // detectar el scroll vertical de la ventana
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50; // se activa tras bajar 50px
  }
}