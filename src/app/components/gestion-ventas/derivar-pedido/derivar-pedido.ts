import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { NgxPaginationModule } from 'ngx-pagination';
import Swal from 'sweetalert2';
import { PedidoService } from '../../../services/pedido.service';
import { PedidoResponse } from '../../../model/pedido';

@Component({
  selector: 'app-derivar-pedido',
  standalone: true,
  imports: [CommonModule, NgxPaginationModule],
  templateUrl: './derivar-pedido.html',
  styleUrl: './derivar-pedido.scss',
})
export class DerivarPedido implements OnInit {
  private readonly pedidoService = inject(PedidoService);
  private readonly cdr = inject(ChangeDetectorRef);

  pedidosPagados: PedidoResponse[] = [];
  pedidosEnPreparacion: PedidoResponse[] = [];
  derivando: boolean = false;
  pagePagados: number = 1;
  pagePreparacion: number = 1;

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

  // confirmacion antes de derivar (criterio HU06) con sweetalert2 como el base
  derivarPedido(pedido: PedidoResponse): void {
    Swal.fire({
      title: `¿Está seguro de derivar el pedido ${pedido.codigoPedido} a almacén?`,
      text: `Cliente: ${pedido.nombreCliente}. Su estado cambiará a "En preparación" y se notificará al trabajador de almacén.`,
      showCancelButton: true,
      cancelButtonText: 'No',
      confirmButtonText: 'Si',
      confirmButtonColor: '#000080',
      cancelButtonColor: '#b5b4b4',
      focusCancel: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarDerivacion(pedido.idPedido);
      }
    });
  }

  private ejecutarDerivacion(id: number): void {
    this.derivando = true;
    this.cdr.detectChanges();

    this.pedidoService.derivarAAlmacen(id).subscribe({
      next: (res) => {
        this.derivando = false;
        Swal.fire({
          icon: 'success',
          title: 'Derivar pedido',
          text: res.message || '¡Pedido derivado a almacén exitosamente ("En preparación")!',
          confirmButtonColor: '#000080',
        });
        this.cargarPedidos();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.derivando = false;
        Swal.fire({
          icon: 'error',
          title: 'Derivar pedido',
          text: err.error?.message || '¡No se pudo derivar el pedido!',
          confirmButtonColor: '#b5b4b4',
        });
        this.cdr.detectChanges();
      },
    });
  }
}
