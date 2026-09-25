import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vinos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vinos.html',
  styleUrl: './vinos.scss'
})
export class Vinos implements OnInit {
  // luego vinculamos al backend
  listaVinos = [
    {
      id: 1,
      nombre: 'Gran Reserva Malbec',
      cepa: 'Malbec 100%',
      precio: 85.00,
      descripcion: 'Vino de color rojo rubí intenso. En nariz presenta aromas a frutos rojos maduros, ciruela y sutiles toques de vainilla aportados por su crianza en barrica de roble francés.',
      maridaje: 'Ideal para acompañar carnes rojas a la parrilla, pastas con salsas intensas y quesos maduros.',
      imagen: 'images/vino_malbec.webp'
    },
    {
      id: 2,
      nombre: 'Valle Sagrado Tannat',
      cepa: 'Tannat 100%',
      precio: 95.50,
      descripcion: 'Estructura firme y color profundo. Destacan notas de mora, chocolate negro y especias. Un vino con gran presencia en boca y final persistente.',
      maridaje: 'Perfecto con cordero asado, carnes de caza y estofados de larga cocción.',
      imagen: 'images/vino_tannat.webp'
    },
    {
      id: 3,
      nombre: 'Blanco de Blancos',
      cepa: 'Chardonnay - Sauvignon Blanc',
      precio: 70.00,
      descripcion: 'Fresco, elegante y vibrante. Resaltan notas cítricas, durazno blanco y toques minerales. Acidez equilibrada que aporta una frescura excepcional.',
      maridaje: 'Excelente compañero de pescados, mariscos frescos, ceviche peruano y ensaladas de verano.',
      imagen: 'images/vino_blancos.webp'
    }
  ];

  currentIndex = 0;

  // fuerza el scroll arriba para ver las historias
  ngOnInit() {
    window.scrollTo(0, 0);
  }

  get vinoActual() {
    return this.listaVinos[this.currentIndex];
  }

  siguiente() {
    this.currentIndex = (this.currentIndex + 1) % this.listaVinos.length;
  }

  anterior() {
    this.currentIndex = (this.currentIndex - 1 + this.listaVinos.length) % this.listaVinos.length;
  }

  // bajar al catálogo
  scrollToCatalogo() {
    const section = document.getElementById('catalogo-vinos');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }
}