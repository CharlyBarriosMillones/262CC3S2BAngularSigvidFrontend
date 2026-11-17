import { Component, inject, signal } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { LoadingService } from './services/loading.service';
import { ToastContainer } from './components/toast-container/toast-container';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, AsyncPipe, Header, Footer, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('262CC3S2BAngularSigvidFrontend');
  loadingService = inject(LoadingService);
}