import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Footer], // agregamos Header y Footer
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = '262CC3S2BAngularSigvidFrontend';
}