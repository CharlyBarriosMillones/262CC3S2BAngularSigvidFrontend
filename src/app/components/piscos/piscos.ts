import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-piscos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './piscos.html',
  styleUrl: './piscos.scss'
})
export class Piscos implements OnInit {
  // luego vinculamos al backend
  listaPiscos = [
    {
      id: 1,
      nombre: 'Pisco Puro Quebranta',
      cepa: 'Uva Quebranta 100%',
      precio: 65.00,
      descripcion: 'Destilado transparente, brillante y límpido. En nariz es sobrio con ligeros tonos a manzana y frutos secos. En boca es estructurado y con carácter, reflejando la fuerza de nuestra uva emblemática.',
      maridaje: 'Ideal para la coctelería clásica peruana como el Pisco Sour, o para acompañar postres tradicionales como el suspiro a la limeña.',
      imagen: 'https://images.unsplash.com/photo-1609951651556-5334e2706168?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 2,
      nombre: 'Pisco Mosto Verde Italia',
      cepa: 'Uva Italia 100%',
      precio: 95.00,
      descripcion: 'Elegante y aterciopelado. Al interrumpir la fermentación, conserva los azúcares naturales que potencian sus aromas cítricos, florales y notas a jazmín y lima.',
      maridaje: 'Perfecto para tomar puro como digestivo frío, o acompañando postres a base de frutas frescas y cítricos.',
      imagen: 'https://images.unsplash.com/photo-1592557678170-071a5c68e1a1?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 3,
      nombre: 'Pisco Acholado Premium',
      cepa: 'Blend: Quebranta, Italia y Torontel',
      precio: 75.00,
      descripcion: 'Un ensamblaje perfecto que combina la estructura de la Quebranta con los aromas exuberantes de las uvas aromáticas. Equilibrado, redondo y muy versátil.',
      maridaje: 'Excelente para Chilcanos y coctelería de autor. Acompaña muy bien piqueos marinos y tiraditos.',
      imagen: 'https://images.unsplash.com/photo-1571597813589-3543eb3e5b32?q=80&w=600&auto=format&fit=crop'
    }
  ];

  currentIndex = 0;

  // fuerza el scroll arriba para ver historia
  ngOnInit() {
    window.scrollTo(0, 0);
  }

  get piscoActual() {
    return this.listaPiscos[this.currentIndex];
  }

  siguiente() {
    this.currentIndex = (this.currentIndex + 1) % this.listaPiscos.length;
  }

  anterior() {
    this.currentIndex = (this.currentIndex - 1 + this.listaPiscos.length) % this.listaPiscos.length;
  }

  // bajar al catalogo
  scrollToCatalogo() {
    const section = document.getElementById('catalogo-piscos');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }
}