import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import Swal from 'sweetalert2';
import { AlmacenService } from '../../../services/almacen.service';
import { StockService } from '../../../services/stock.service';
import { ToastService } from '../../../services/toast.service';
import { PedidoResponse } from '../../../model/pedido';
import { AlmacenResponse } from '../../../model/stock';
import {
  AsignacionRequest,
  GuiaDespachoResponse,
  PedidoAlmacenDetalleResponse,
} from '../../../model/guia-despacho';
import { Patrones } from '../../../util/patrones';

@Component({
  selector: 'app-asignar-pedido',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxPaginationModule],
  templateUrl: './asignar-pedido.html',
  styleUrl: './asignar-pedido.scss',
})
export class AsignarPedido implements OnInit {
  private readonly almacenService = inject(AlmacenService);
  private readonly stockService = inject(StockService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  pedidosPendientes: PedidoResponse[] = [];
  almacenes: AlmacenResponse[] = [];
  pedidoSeleccionado: PedidoResponse | null = null;
  detalle: PedidoAlmacenDetalleResponse | null = null;
  guiaGenerada: GuiaDespachoResponse | null = null;

  page: number = 1;
  asignando: boolean = false;

  almacenControl = new FormControl<number | null>(1, [Validators.required]);
  asignacionForm = new FormGroup({
    lineas: new FormArray<FormControl<number>>([]),
  });

  get lineasArray(): FormArray<FormControl<number>> {
    return this.asignacionForm.controls.lineas;
  }

  ngOnInit(): void {
    this.cargarAlmacenes();
    this.cargarPendientes();
  }

  cargarAlmacenes(): void {
    this.stockService.listarAlmacenes().subscribe({
      next: (alms) => {
        this.almacenes = alms;
        if (alms.length > 0 && !this.almacenControl.value) {
          this.almacenControl.setValue(alms[0].idAlmacen);
        }
        this.cdr.detectChanges();
      },
    });
  }

  cargarPendientes(): void {
    this.almacenService.listarPedidosPendientes().subscribe({
      next: (lista) => {
        this.pedidosPendientes = lista;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.toastService.show(err.error?.message || 'Error al cargar pedidos pendientes.', 'danger');
      },
    });
  }

  seleccionarPedido(pedido: PedidoResponse): void {
    this.pedidoSeleccionado = pedido;
    this.guiaGenerada = null;
    this.cargarDetallePedido(pedido.idPedido, this.almacenControl.value);
  }

  onCambioAlmacen(): void {
    if (this.pedidoSeleccionado) {
      this.cargarDetallePedido(this.pedidoSeleccionado.idPedido, this.almacenControl.value);
    }
  }

  private cargarDetallePedido(idPedido: number, idAlmacen?: number | null): void {
    this.almacenService.obtenerDetallePedido(idPedido, idAlmacen).subscribe({
      next: (det) => {
        this.detalle = det;
        this.almacenControl.setValue(det.idAlmacen, { emitEvent: false });
        this.lineasArray.clear();
        for (const linea of det.lineas) {
          const max = this.maximoAsignable(linea.cantidadSolicitada, linea.stockDisponible);
          this.lineasArray.push(
            new FormControl<number>(linea.cantidadSugerida, {
              nonNullable: true,
              validators: [
                Validators.required,
                Validators.min(0),
                Validators.max(max),
                Validators.pattern(Patrones.ENTERO),
              ],
            })
          );
        }
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.toastService.show(err.error?.message || 'No se pudo cargar el detalle del pedido.', 'danger');
      },
    });
  }

  maximoAsignable(solicitado: number, disponible: number): number {
    return Math.max(0, Math.min(solicitado, disponible));
  }

  get totalAsignado(): number {
    return this.lineasArray.controls.reduce((sum, ctrl) => sum + (Number(ctrl.value) || 0), 0);
  }

  confirmarAsignacion(): void {
    if (!this.detalle) return;

    if (this.almacenControl.invalid) {
      this.almacenControl.markAsTouched();
      return;
    }

    if (this.asignacionForm.invalid) {
      this.asignacionForm.markAllAsTouched();
      this.toastService.show('Verifique las cantidades asignadas.', 'warning');
      return;
    }

    if (this.totalAsignado <= 0) {
      this.toastService.show('Debe asignar al menos una unidad para generar la guía.', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Confirmar asignación y generar guía?',
      text: `Pedido ${this.detalle.codigoPedido} — ${this.totalAsignado} unidades asignadas`,
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sí, generar guía',
      confirmButtonColor: '#000080',
      cancelButtonColor: '#b5b4b4',
      focusCancel: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarAsignacion();
      }
    });
  }

  private ejecutarAsignacion(): void {
    if (!this.detalle || !this.almacenControl.value) return;

    this.asignando = true;
    const request: AsignacionRequest = {
      idAlmacen: Number(this.almacenControl.value),
      lineas: this.detalle.lineas.map((linea, i) => ({
        idProducto: linea.idProducto,
        cantidadAsignada: Number(this.lineasArray.at(i).value ?? 0),
      })),
    };

    this.almacenService.asignarProductos(this.detalle.idPedido, request).subscribe({
      next: (res) => {
        this.asignando = false;
        this.guiaGenerada = res.object;
        this.detalle = null;
        this.pedidoSeleccionado = null;
        Swal.fire({
          icon: 'success',
          title: 'Guía preliminar generada',
          text: res.message || 'Productos asignados correctamente.',
          confirmButtonColor: '#000080',
        });
        this.cargarPendientes();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.asignando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error en asignación',
          text: err.error?.message || 'No se pudo generar la guía de despacho.',
          confirmButtonColor: '#b5b4b4',
        });
        this.cdr.detectChanges();
      },
    });
  }
}