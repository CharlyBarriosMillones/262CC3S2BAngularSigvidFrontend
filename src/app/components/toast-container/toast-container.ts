import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastType } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.scss',
})
export class ToastContainer {
  toastService = inject(ToastService);

  getToastClass(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'bg-success text-white border-0';
      case 'danger':
        return 'bg-danger text-white border-0';
      case 'warning':
        return 'bg-warning text-dark border-0';
      case 'info':
      default:
        return 'bg-dark text-white border border-warning';
    }
  }
}