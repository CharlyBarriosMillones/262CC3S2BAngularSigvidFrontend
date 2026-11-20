import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import Swal from 'sweetalert2';
import { PedidoService } from '../../../services/pedido.service';
import { PagoService } from '../../../services/pago.service';
import { SessionService } from '../../../services/session.service';
import { ToastService } from '../../../services/toast.service';
import { PedidoResponse } from '../../../model/pedido';
import { Caja, PagoRequest, PagoResponse } from '../../../model/pago';
import { Limites, Patrones } from '../../../util/patrones';

@Component({
  selector: 'app-registrar-pago',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxPaginationModule],
  templateUrl: './registrar-pago.html',
  styleUrl: './registrar-pago.scss',
})
export class RegistrarPago implements OnInit {
  private readonly pedidoService = inject(PedidoService);
  private readonly pagoService = inject(PagoService);
  private readonly sessionService = inject(SessionService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('voucherInput') voucherInput?: ElementRef<HTMLInputElement>;

  busquedaForm = new FormGroup({
    termino: new FormControl('', [
      Validators.maxLength(Limites.BUSQUEDA_MAX),
      Validators.pattern(Patrones.BUSQUEDA),
    ]),
  });

  pagoForm = new FormGroup({
    metodo: new FormControl<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(Patrones.METODO_PAGO)],
    }),
    idCaja: new FormControl<number | null>(1, [Validators.required]),
    montoRecibido: new FormControl<number | null>(0, [Validators.required, Validators.min(0)]),
    codigoVoucher: new FormControl('', [Validators.pattern(Patrones.CODIGO_VOUCHER)]),
  });

  pedidosEncontrados: PedidoResponse[] = [];
  pedidoSeleccionado: PedidoResponse | null = null;
  cajas: Caja[] = [];
  pagosRealizados: PagoResponse[] = [];

  pagePedidos: number = 1;
  pagePagos: number = 1;

  voucherBase64: string = '';
  nombreArchivoVoucher: string = '';
  errorArchivoVoucher: string = '';

  ultimoPago: PagoResponse | null = null;
  procesandoPago: boolean = false;

  ngOnInit(): void {
    this.cargarCajas();
    this.buscarPedidos();
    this.cargarHistorialPagos();
  }

  cargarCajas(): void {
    this.pagoService.listarCajas().subscribe({
      next: (cajas) => {
        this.cajas = cajas;
        if (cajas.length > 0 && !this.pagoForm.controls.idCaja.value) {
          this.pagoForm.controls.idCaja.setValue(cajas[0].idCaja);
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
    if (this.busquedaForm.invalid) {
      this.busquedaForm.markAllAsTouched();
      return;
    }
    const termino = this.busquedaForm.controls.termino.value ?? '';
    this.pedidoService.listarPedidos(undefined, termino).subscribe({
      next: (pedidos) => {
        this.pedidosEncontrados = pedidos;
        this.pagePedidos = 1;
        this.cdr.detectChanges();
      },
    });
  }

  seleccionarPedido(pedido: PedidoResponse): void {
    this.pedidoSeleccionado = pedido;
    this.pagoForm.patchValue({
      metodo: 'Efectivo',
      montoRecibido: pedido.importeTotal,
      codigoVoucher: '',
    });
    this.voucherBase64 = '';
    this.nombreArchivoVoucher = '';
    this.errorArchivoVoucher = '';
    this.ultimoPago = null;
  }

  get esEfectivo(): boolean {
    return this.pagoForm.controls.metodo.value === 'Efectivo';
  }

  get vueltoCalculado(): number {
    if (!this.pedidoSeleccionado || !this.esEfectivo) {
      return 0;
    }
    const recibido = Number(this.pagoForm.controls.montoRecibido.value ?? 0);
    const diff = recibido - this.pedidoSeleccionado.importeTotal;
    return diff > 0 ? Number(diff.toFixed(2)) : 0;
  }

  get saldoCajaActual(): number {
    const idCaja = Number(this.pagoForm.controls.idCaja.value);
    const caja = this.cajas.find((c) => c.idCaja === idCaja);
    return caja ? caja.saldoActual : 0;
  }

  onAdjuntarVoucher(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.errorArchivoVoucher = '';
    if (!input.files || input.files.length === 0) {
      this.voucherBase64 = '';
      this.nombreArchivoVoucher = '';
      return;
    }

    const file = input.files[0];
    const permitidos = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!permitidos.includes(file.type)) {
      this.errorArchivoVoucher = 'Solo se permiten archivos PNG, JPEG o PDF.';
      this.voucherBase64 = '';
      this.nombreArchivoVoucher = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.errorArchivoVoucher = 'El archivo no debe superar los 2 MB.';
      this.voucherBase64 = '';
      this.nombreArchivoVoucher = '';
      return;
    }

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

    if (this.pagoForm.invalid) {
      this.pagoForm.markAllAsTouched();
      this.toastService.show('Revise los datos del formulario de pago.', 'warning');
      return;
    }

    const { metodo, montoRecibido } = this.pagoForm.getRawValue();
    const recibido = Number(montoRecibido ?? 0);

    if (metodo === 'Efectivo' && recibido < this.pedidoSeleccionado.importeTotal) {
      this.toastService.show('El monto recibido en efectivo es menor al importe del pedido.', 'danger');
      return;
    }

    if (metodo !== 'Efectivo' && !this.voucherBase64) {
      this.errorArchivoVoucher = 'Debe adjuntar el voucher digital (PNG, JPEG o PDF).';
      this.toastService.show(this.errorArchivoVoucher, 'warning');
      return;
    }

    Swal.fire({
      title: '¿Confirmar registro de pago?',
      text: `Pedido ${this.pedidoSeleccionado.codigoPedido} — S/ ${this.pedidoSeleccionado.importeTotal.toFixed(2)} (${metodo})`,
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sí, cobrar',
      confirmButtonColor: '#000080',
      cancelButtonColor: '#b5b4b4',
      focusCancel: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarPago();
      }
    });
  }

  private ejecutarPago(): void {
    if (!this.pedidoSeleccionado) return;

    this.procesandoPago = true;
    this.cdr.detectChanges();
    const sesion = this.sessionService.getInfoSession();
    const { metodo, idCaja, montoRecibido, codigoVoucher } = this.pagoForm.getRawValue();

    const request: PagoRequest = {
      idPedido: this.pedidoSeleccionado.idPedido,
      idCajero: sesion?.usuarioId || undefined,
      nombreMetodo: metodo,
      idCaja: Number(idCaja),
      montoRecibido: Number(montoRecibido ?? this.pedidoSeleccionado.importeTotal),
      codigoVoucher: codigoVoucher?.trim() ? codigoVoucher.trim() : undefined,
      voucherBase64: !this.esEfectivo && this.voucherBase64 ? this.voucherBase64 : undefined,
    };

    this.pagoService.registrarPago(request).subscribe({
      next: (res) => {
        this.procesandoPago = false;
        this.ultimoPago = res.object;
        Swal.fire({
          icon: 'success',
          title: 'Pago registrado',
          text: res.message || 'Pago registrado exitosamente.',
          confirmButtonColor: '#000080',
        });
        if (res.object?.notificacionVendedor) {
          this.toastService.show(res.object.notificacionVendedor, 'info', 5000);
        }
        this.pedidoSeleccionado = null;
        this.pagoForm.patchValue({ codigoVoucher: '', montoRecibido: 0 });
        this.voucherBase64 = '';
        this.nombreArchivoVoucher = '';
        if (this.voucherInput) {
          this.voucherInput.nativeElement.value = '';
        }
        this.cargarCajas();
        this.buscarPedidos();
        this.cargarHistorialPagos();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.procesandoPago = false;
        Swal.fire({
          icon: 'error',
          title: 'Error al registrar pago',
          text: err.error?.message || 'No se pudo procesar el pago.',
          confirmButtonColor: '#b5b4b4',
        });
        this.cdr.detectChanges();
      },
    });
  }
}