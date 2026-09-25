import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-corchos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './corchos.html',
  styleUrl: './corchos.scss'
})
export class Corchos implements OnInit {
  listaCorchos = [
    {
      id: 1,
      nombre: 'Corcho Natural Flor',
      tipo: '100% Alcornoque Natural',
      precio: 1.50,
      descripcion: 'Extraído de la corteza del alcornoque con el máximo grado de pureza. Su elasticidad y permeabilidad controlada permiten una microoxigenación perfecta, indispensable para la evolución de los vinos de gran reserva.',
      uso: 'Exclusivo para vinos tintos de larga guarda (más de 5 años en botella).',
      imagen: 'images/corcho_natural_flor.webp'
    },
    {
      id: 2,
      nombre: 'Microaglomerado Premium',
      tipo: 'Gránulos de corcho natural',
      precio: 0.85,
      descripcion: 'Fabricado a partir de gránulos de corcho esterilizados y moldeados. Garantiza una homogeneidad absoluta botella tras botella, eliminando cualquier riesgo de desviaciones aromáticas (TCA).',
      uso: 'Ideal para vinos blancos, rosados y tintos jóvenes de consumo rápido (1 a 3 años).',
      imagen: 'images/corcho_microaglomerado.webp'
    },
    {
      id: 3,
      nombre: 'Tapón Cabezudo (T-Cork)',
      tipo: 'Cuerpo natural con tapa de madera',
      precio: 1.20,
      descripcion: 'Diseño ergonómico que permite un descorche manual sin necesidad de sacacorchos. El cuerpo inferior asegura un sellado hermético que protege los destilados de la evaporación.',
      uso: 'Diseñado específicamente para nuestra línea de Piscos y licores premium.',
      imagen: 'images/corcho_cabezudo.webp'
    }
  ];

  currentIndex = 0;

  ngOnInit() {
    window.scrollTo(0, 0);
  }

  get corchoActual() {
    return this.listaCorchos[this.currentIndex];
  }

  siguiente() {
    this.currentIndex = (this.currentIndex + 1) % this.listaCorchos.length;
  }

  anterior() {
    this.currentIndex = (this.currentIndex - 1 + this.listaCorchos.length) % this.listaCorchos.length;
  }

  scrollToCatalogo() {
    const section = document.getElementById('catalogo-corchos');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }
}