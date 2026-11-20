import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import QRCode from 'qrcode';
import Swal from 'sweetalert2';
import { AlmacenService } from '../../../services/almacen.service';
import { ToastService } from '../../../services/toast.service';
import { DetalleGuiaResponse, GuiaDespachoResponse } from '../../../model/guia-despacho';
import { Patrones } from '../../../util/patrones';

@Component({
  selector: 'app-registrar-salida',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxPaginationModule],
  templateUrl: './registrar-salida.html',
  styleUrl: './registrar-salida.scss',
})
export class RegistrarSalida implements OnInit {
  private readonly almacenService = inject(AlmacenService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  guiasPreliminares: GuiaDespachoResponse[] = [];
  guiasDespachadas: GuiaDespachoResponse[] = [];
  guiaSeleccionada: GuiaDespachoResponse | null = null;
  qrImagenes: Record<number, string> = {};

  codigoManualControl = new FormControl('', [
    Validators.maxLength(120),
    Validators.pattern(Patrones.TEXTO_SEGURO),
  ]);

  pagePreliminar: number = 1;
  pageDespachadas: number = 1;
  escaneandoId: number | null = null;
  confirmandoSalida: boolean = false;

  ngOnInit(): void {
    this.cargarGuias();
  }

  cargarGuias(): void {
    this.almacenService.listarGuias('Preliminar').subscribe({
      next: (lista) => {
        this.guiasPreliminares = lista;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.toastService.show(err.error?.message || 'Error al cargar guías preliminares.', 'danger');
      },
    });

    this.almacenService.listarGuias('Despachada').subscribe({
      next: (lista) => {
        this.guiasDespachadas = lista;
        this.cdr.detectChanges();
      },
    });
  }

  async seleccionarGuia(guia: GuiaDespachoResponse): Promise<void> {
    this.guiaSeleccionada = guia;
    this.codigoManualControl.reset('');
    await this.generarQrsDeGuia(guia);
    this.cdr.detectChanges();
  }

  private async generarQrsDeGuia(guia: GuiaDespachoResponse): Promise<void> {
    const mapa: Record<number, string> = {};
    for (const d of guia.detalles) {
      if (d.codigoQr) {
        try {
          mapa[d.idDetalle] = await QRCode.toDataURL(d.codigoQr, {
            width: 120,
            margin: 1,
            color: { dark: '#141210', light: '#ffffff' },
          });
        } catch {
          mapa[d.idDetalle] = '';
        }
      }
    }
    this.qrImagenes = mapa;
  }

  escanearItem(detalle: DetalleGuiaResponse): void {
    if (!this.guiaSeleccionada || !detalle.codigoQr) return;

    this.escaneandoId = detalle.idDetalle;
    this.almacenService
      .registrarEscaneo(this.guiaSeleccionada.idGuia, detalle.idDetalle, detalle.codigoQr)
      .subscribe({
        next: async (res) => {
          this.escaneandoId = null;
          if (res.object) {
            this.guiaSeleccionada = res.object;
            await this.generarQrsDeGuia(res.object);
          }
          this.toastService.show(res.message || 'Producto escaneado.', 'success');
          this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => {
          this.escaneandoId = null;
          this.toastService.show(err.error?.message || 'Error al escanear el QR.', 'danger');
          this.cdr.detectChanges();
        },
      });
  }

  escanearPorCodigoManual(): void {
    if (!this.guiaSeleccionada) return;
    if (this.codigoManualControl.invalid) {
      this.codigoManualControl.markAsTouched();
      return;
    }

    const texto = (this.codigoManualControl.value ?? '').trim();
    if (!texto) {
      this.toastService.show('Ingrese o pegue el código QR leído.', 'warning');
      return;
    }

    const item = this.guiaSeleccionada.detalles.find((d) => d.codigoQr === texto);
    if (!item) {
      this.toastService.show('El código QR ingresado no coincide con ningún producto de esta guía.', 'danger');
      return;
    }

    this.codigoManualControl.reset('');
    this.escanearItem(item);
  }

  get puedeConfirmarSalida(): boolean {
    if (!this.guiaSeleccionada) return false;
    return (
      this.guiaSeleccionada.totalItems > 0 &&
      this.guiaSeleccionada.itemsEscaneados === this.guiaSeleccionada.totalItems
    );
  }

  confirmarSalida(): void {
    if (!this.guiaSeleccionada || !this.puedeConfirmarSalida) return;

    Swal.fire({
      title: '¿Confirmar salida de almacén?',
      text: `Se descontará el stock y el pedido ${this.guiaSeleccionada.codigoPedido} pasará a "En tránsito".`,
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sí, despachar',
      confirmButtonColor: '#000080',
      cancelButtonColor: '#b5b4b4',
      focusCancel: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarSalida();
      }
    });
  }

  private ejecutarSalida(): void {
    if (!this.guiaSeleccionada) return;

    this.confirmandoSalida = true;
    this.almacenService.confirmarSalida(this.guiaSeleccionada.idGuia).subscribe({
      next: (res) => {
        this.confirmandoSalida = false;
        this.guiaSeleccionada = null;
        this.qrImagenes = {};
        Swal.fire({
          icon: 'success',
          title: 'Salida confirmada',
          text: res.message || 'Stock descontado y pedido en tránsito.',
          confirmButtonColor: '#000080',
        });
        this.cargarGuias();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.confirmandoSalida = false;
        Swal.fire({
          icon: 'error',
          title: 'Error al confirmar salida',
          text: err.error?.message || 'No se pudo registrar la salida.',
          confirmButtonColor: '#b5b4b4',
        });
        this.cdr.detectChanges();
      },
    });
  }
}