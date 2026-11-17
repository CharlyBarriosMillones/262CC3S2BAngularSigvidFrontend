import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../../services/pedido.service';
import { PagoService } from '../../../services/pago.service';
import { SessionService } from '../../../services/session.service';
import { ToastService } from '../../../services/toast.service';
import { PedidoResponse } from '../../../model/pedido';
import { Caja, MetodoPago, PagoRequest, PagoResponse } from '../../../model/pago';

@Component({
  selector: 'app-registrar-pago',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registrar-pago.html',
  styleUrl: './registrar-pago.scss',
})
export class RegistrarPago implements OnInit {
  private readonly pedidoService = inject(PedidoService);
  private readonly pagoService = inject(PagoService);
  private readonly sessionService = inject(SessionService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  terminoBusqueda: string = '';
  pedidosEncontrados: PedidoResponse[] = [];
  pedidoSeleccionado: PedidoResponse | null = null;

  metodosPago: MetodoPago[] = [];
  cajas: Caja[] = [];
  pagosRealizados: PagoResponse[] = [];

  metodoSeleccionado: string = 'Efectivo';
  idCajaSeleccionada: number = 1;
  montoRecibido: number = 0;
  codigoVoucher: string = '';
  voucherBase64: string = '';
  nombreArchivoVoucher: string = '';

  ultimoPago: PagoResponse | null = null;
  procesandoPago: boolean = false;

  ngOnInit(): void {
    this.cargarDatosCajaYMetodos();
    this.buscarPedidos();
    this.cargarHistorialPagos();
  }

  cargarDatosCajaYMetodos(): void {
    this.pagoService.listarMetodosPago().subscribe({
      next: (metodos) => {
        this.metodosPago = metodos;
        this.cdr.detectChanges();
      },
    });
    this.pagoService.listarCajas().subscribe({
      next: (cajas) => {
        this.cajas = cajas;
        if (cajas.length > 0) {
          this.idCajaSeleccionada = cajas[0].idCaja;
        }
        this.cdr.detectChanges();
      },
    });
  }

  cargarHistorialPagos(): void {
    this.pagoService.listarPagos().subscribe({
      next: (pagos) => {
        this.pagosRealizados = pagos;
        this.cdr.detectChanges();
      },
    });
  }

  buscarPedidos(): void {
    this.pedidoService.listarPedidos(undefined, this.terminoBusqueda).subscribe({
      next: (pedidos) => {
        this.pedidosEncontrados = pedidos;
        this.cdr.detectChanges();
      },
    });
  }

  seleccionarPedido(pedido: PedidoResponse): void {
    this.pedidoSeleccionado = pedido;
    this.montoRecibido = pedido.importeTotal;
    this.ultimoPago = null;
  }

  get vueltoCalculado(): number {
    if (!this.pedidoSeleccionado || this.metodoSeleccionado !== 'Efectivo') {
      return 0;
    }
    const diff = this.montoRecibido - this.pedidoSeleccionado.importeTotal;
    return diff > 0 ? Number(diff.toFixed(2)) : 0;
  }

  get saldoCajaActual(): number {
    const caja = this.cajas.find((c) => c.idCaja === Number(this.idCajaSeleccionada));
    return caja ? caja.saldoActual : 0;
  }

  onAdjuntarVoucher(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.nombreArchivoVoucher = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      this.voucherBase64 = reader.result as string;
      this.toastService.show(`Voucher digital adjuntado: ${file.name}`, 'info');
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  confirmarPago(): void {
    if (!this.pedidoSeleccionado) {
      this.toastService.show('Seleccione un pedido pendiente para registrar el pago.', 'warning');
      return;
    }

    if (
      this.metodoSeleccionado === 'Efectivo' &&
      this.montoRecibido < this.pedidoSeleccionado.importeTotal
    ) {
      this.toastService.show('El monto recibido en efectivo es menor al importe del pedido.', 'danger');
      return;
    }

    this.procesandoPago = true;
    const sesion = this.sessionService.getInfoSession();

    const request: PagoRequest = {
      idPedido: this.pedidoSeleccionado.idPedido,
      idCajero: sesion?.usuarioId || undefined,
      nombreMetodo: this.metodoSeleccionado,
      idCaja: Number(this.idCajaSeleccionada),
      montoRecibido: this.montoRecibido,
      codigoVoucher: this.codigoVoucher || undefined,
      voucherBase64: this.voucherBase64 || undefined,
    };

    this.pagoService.registrarPago(request).subscribe({
      next: (res) => {
        this.procesandoPago = false;
        this.ultimoPago = res.object;
        this.toastService.show(res.message || 'Pago registrado exitosamente.', 'success');
        if (res.object?.notificacionVendedor) {
          this.toastService.show(res.object.notificacionVendedor, 'info', 5000);
        }
        this.pedidoSeleccionado = null;
        this.codigoVoucher = '';
        this.voucherBase64 = '';
        this.nombreArchivoVoucher = '';
        this.cargarDatosCajaYMetodos();
        this.buscarPedidos();
        this.cargarHistorialPagos();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.procesandoPago = false;
        this.toastService.show(err.error?.message || 'Error al registrar el pago.', 'danger');
        this.cdr.detectChanges();
      },
    });
  }
}