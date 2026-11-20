import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import Swal from 'sweetalert2';
import { RecepcionService } from '../../../services/recepcion.service';
import { ToastService } from '../../../services/toast.service';
import { GuiaDespachoResponse } from '../../../model/guia-despacho';
import { RecepcionRequest } from '../../../model/recepcion';
import { Patrones } from '../../../util/patrones';

@Component({
  selector: 'app-confirmar-recepcion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxPaginationModule],
  templateUrl: './confirmar-recepcion.html',
  styleUrl: './confirmar-recepcion.scss',
})
export class ConfirmarRecepcion implements OnInit {
  private readonly recepcionService = inject(RecepcionService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('firmaCanvas') firmaCanvas?: ElementRef<HTMLCanvasElement>;

  pedidosEnTransito: GuiaDespachoResponse[] = [];
  guiaSeleccionada: GuiaDespachoResponse | null = null;
  ultimaRecepcion: GuiaDespachoResponse | null = null;

  page: number = 1;
  confirmando: boolean = false;
  mostrarFirma: boolean = false;
  firmaVacia: boolean = true;
  private dibujando: boolean = false;

  recepcionForm = new FormGroup({
    lineas: new FormArray<FormControl<number>>([]),
    observaciones: new FormControl('', [
      Validators.maxLength(300),
      Validators.pattern(Patrones.TEXTO_SEGURO),
    ]),
  });

  get lineasArray(): FormArray<FormControl<number>> {
    return this.recepcionForm.controls.lineas;
  }

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    this.recepcionService.listarPedidosEnTransito().subscribe({
      next: (lista) => {
        this.pedidosEnTransito = lista;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.toastService.show(err.error?.message || 'Error al cargar pedidos en tránsito.', 'danger');
      },
    });
  }

  seleccionarPedido(guia: GuiaDespachoResponse): void {
    this.guiaSeleccionada = guia;
    this.ultimaRecepcion = null;
    this.mostrarFirma = false;
    this.firmaVacia = true;
    this.recepcionForm.controls.observaciones.reset('');
    this.lineasArray.clear();

    for (const d of guia.detalles) {
      this.lineasArray.push(
        new FormControl<number>(d.cantidadAsignada, {
          nonNullable: true,
          validators: [
            Validators.required,
            Validators.min(0),
            Validators.max(d.cantidadAsignada),
            Validators.pattern(Patrones.ENTERO),
          ],
        })
      );
    }
  }

  iniciarTrazo(event: PointerEvent): void {
    const canvas = this.firmaCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.dibujando = true;
    this.firmaVacia = false;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = '#141210';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
  }

  continuarTrazo(event: PointerEvent): void {
    if (!this.dibujando) return;
    const canvas = this.firmaCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    ctx.stroke();
  }

  terminarTrazo(): void {
    this.dibujando = false;
  }

  limpiarFirma(): void {
    const canvas = this.firmaCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.firmaVacia = true;
  }

  confirmarConformidad(): void {
    this.enviarConfirmacion('CONFORMIDAD');
  }

  confirmarConFirma(): void {
    const canvas = this.firmaCanvas?.nativeElement;
    if (!canvas || this.firmaVacia) {
      this.toastService.show('Dibuje su firma en el recuadro antes de confirmar.', 'warning');
      return;
    }
    const firmaBase64 = canvas.toDataURL('image/png');
    this.enviarConfirmacion('FIRMA', firmaBase64);
  }

  private enviarConfirmacion(tipo: 'CONFORMIDAD' | 'FIRMA', firmaDigital?: string): void {
    if (!this.guiaSeleccionada) return;

    if (this.recepcionForm.invalid) {
      this.recepcionForm.markAllAsTouched();
      this.toastService.show('Verifique las cantidades recibidas y las observaciones.', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Confirmar recepción del pedido?',
      text: `Pedido ${this.guiaSeleccionada.codigoPedido} (${tipo === 'FIRMA' ? 'Con firma digital' : 'Conformidad simple'})`,
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sí, confirmar entrega',
      confirmButtonColor: '#000080',
      cancelButtonColor: '#b5b4b4',
      focusCancel: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarRecepcion(tipo, firmaDigital);
      }
    });
  }

  private ejecutarRecepcion(tipo: 'CONFORMIDAD' | 'FIRMA', firmaDigital?: string): void {
    if (!this.guiaSeleccionada) return;

    this.confirmando = true;
    const obs = this.recepcionForm.controls.observaciones.value?.trim();
    const request: RecepcionRequest = {
      tipo,
      firmaDigital,
      observaciones: obs ? obs : undefined,
      lineas: this.guiaSeleccionada.detalles.map((d, i) => ({
        idDetalle: d.idDetalle,
        cantidadRecibida: Number(this.lineasArray.at(i).value ?? 0),
      })),
    };

    this.recepcionService.confirmarRecepcion(this.guiaSeleccionada.idPedido, request).subscribe({
      next: (res) => {
        this.confirmando = false;
        this.ultimaRecepcion = res.object;
        this.guiaSeleccionada = null;
        this.mostrarFirma = false;
        Swal.fire({
          icon: 'success',
          title: 'Recepción confirmada',
          text: res.message || 'Pedido marcado como Entregado.',
          confirmButtonColor: '#000080',
        });
        this.cargarPedidos();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.confirmando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error al confirmar recepción',
          text: err.error?.message || 'No se pudo registrar la recepción.',
          confirmButtonColor: '#b5b4b4',
        });
        this.cdr.detectChanges();
      },
    });
  }
}