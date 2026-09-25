import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vinos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vinos.html',
  styleUrl: './vinos.scss'
})
export class Vinos {
  // luego vinculamos con el backend
  listaVinos = [
    {
      id: 1,
      nombre: 'Gran Reserva Malbec',
      cepa: 'Malbec 100%',
      precio: 85.00,
      imagen: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 2,
      nombre: 'Valle Sagrado Tannat',
      cepa: 'Tannat 100%',
      precio: 95.50,
      imagen: 'https://images.unsplash.com/photo-1586441444096-b518eaa19b59?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 3,
      nombre: 'Blanco de Blancos',
      cepa: 'Chardonnay - Sauvignon Blanc',
      precio: 70.00,
      imagen: 'https://images.unsplash.com/photo-1594631252845-29bfc41f0980?q=80&w=600&auto=format&fit=crop'
    }
  ];
}