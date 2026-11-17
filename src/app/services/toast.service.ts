import { Injectable } from '@angular/core';

export type ToastType = 'success' | 'danger' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  delay: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toasts: Toast[] = [];
  private counter = 0;

  show(message: string, type: ToastType = 'info', delay = 3500): void {
    const toast: Toast = {
      id: ++this.counter,
      message,
      type,
      delay,
    };
    this.toasts.push(toast);
    setTimeout(() => this.remove(toast), delay);
  }

  remove(toast: Toast): void {
    this.toasts = this.toasts.filter((t) => t.id !== toast.id);
  }

  clear(): void {
    this.toasts = [];
  }
}