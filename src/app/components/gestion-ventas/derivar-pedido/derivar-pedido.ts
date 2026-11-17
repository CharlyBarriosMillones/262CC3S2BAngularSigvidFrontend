import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService } from '../../../services/pedido.service';
import { ToastService } from '../../../services/toast.service';
import { PedidoResponse } from '../../../model/pedido';

@Component({
  selector: 'app-derivar-pedido',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './derivar-pedido.html',
  styleUrl: './derivar-pedido.scss',
})
export class DerivarPedido implements OnInit {
  private readonly pedidoService = inject(PedidoService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  pedidosPagados: PedidoResponse[] = [];
  pedidosEnPreparacion: PedidoResponse[] = [];
  pedidoPorConfirmar: PedidoResponse | null = null;
  derivando: boolean = false;

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    this.pedidoService.listarPedidos('Pagado').subscribe({
      next: (pagados) => {
        this.pedidosPagados = pagados;
        this.cdr.detectChanges();
      },
    });

    this.pedidoService.listarPedidos('En preparación').subscribe({
      next: (enPrep) => {
        this.pedidosEnPreparacion = enPrep;
        this.cdr.detectChanges();
      },
    });
  }

  solicitarConfirmacionDerivacion(pedido: PedidoResponse): void {
    this.pedidoPorConfirmar = pedido;
  }

  cancelarConfirmacion(): void {
    this.pedidoPorConfirmar = null;
  }

  ejecutarDerivacion(): void {
    if (!this.pedidoPorConfirmar) return;

    this.derivando = true;
    const id = this.pedidoPorConfirmar.idPedido;

    this.pedidoService.derivarAAlmacen(id).subscribe({
      next: (res) => {
        this.derivando = false;
        this.pedidoPorConfirmar = null;
        this.toastService.show(
          res.message || 'Pedido derivado a almacén exitosamente ("En preparación").',
          'success',
          4500
        );
        this.cargarPedidos();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.derivando = false;
        this.toastService.show(err.error?.message || 'No se pudo derivar el pedido.', 'danger');
        this.cdr.detectChanges();
      },
    });
  }
}