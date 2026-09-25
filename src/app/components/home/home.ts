import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
  
  // esta funcion hace scroll suave a las categorias
  scrollToCategorias() {
    const section = document.getElementById('categorias');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }
}