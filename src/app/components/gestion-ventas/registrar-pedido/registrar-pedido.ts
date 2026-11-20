import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import Swal from 'sweetalert2';
import { ProductoService } from '../../../services/producto.service';
import { PedidoService } from '../../../services/pedido.service';
import { UsuarioService } from '../../../services/usuario.service';
import { SessionService } from '../../../services/session.service';
import { ToastService } from '../../../services/toast.service';
import { Producto } from '../../../model/producto';
import { PedidoRequest, PedidoResponse } from '../../../model/pedido';
import { Limites, Patrones } from '../../../util/patrones';
import { dniORuc, mayorQueCero } from '../../../util/validadores';

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

// el porcentaje de descuento no puede superar 100
function porcentajeMaximo(group: AbstractControl): ValidationErrors | null {
  const tipo = group.get('tipoDescuento')?.value;
  const valor = Number(group.get('valorDescuento')?.value ?? 0);
  return tipo === 'PORCENTAJE' && valor > 100 ? { porcentajeMaximo: true } : null;
}

@Component({
  selector: 'app-registrar-pedido',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxPaginationModule],
  templateUrl: './registrar-pedido.html',
  styleUrl: './registrar-pedido.scss',
})
export class RegistrarPedido implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly pedidoService = inject(PedidoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly sessionService = inject(SessionService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  productosDisponibles: Producto[] = [];
  pedidosRecientes: PedidoResponse[] = [];
  page: number = 1;

  // busqueda de cliente por dni o ruc (HU04 4.1)
  clienteForm = new FormGroup({
    documento: new FormControl('', [Validators.required, dniORuc]),
    clienteRuc: new FormControl('', [Validators.pattern(Patrones.RUC)]),
  });
  clienteEncontrado: any | null = null;

  // seleccion de producto para agregar al pedido
  productoForm = new FormGroup({
    idProducto: new FormControl<number | null>(null, [Validators.required]),
    cantidad: new FormControl<number | null>(1, [
      Validators.required,
      Validators.min(Limites.CANTIDAD_MIN),
      Validators.max(Limites.CANTIDAD_MAX),
      Validators.pattern(Patrones.ENTERO),
    ]),
    precio: new FormControl<number | null>(null, [Validators.required, mayorQueCero]),
  });

  carrito: ItemCarrito[] = [];

  // descuento (porcentaje o monto fijo) y factura SUNAT (HU04)
  liquidacionForm = new FormGroup(
    {
      tipoDescuento: new FormControl<'PORCENTAJE' | 'MONTO_FIJO'>('PORCENTAJE', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(Patrones.TIPO_DESCUENTO)],
      }),
      valorDescuento: new FormControl<number | null>(0, [Validators.required, Validators.min(0)]),
      emitirFacturaElectronica: new FormControl<boolean>(true, { nonNullable: true }),
    },
    { validators: porcentajeMaximo }
  );

  ultimoPedidoRegistrado: PedidoResponse | null = null;
  registrando: boolean = false;

  constructor() {
    // si cambia el documento, el cliente encontrado deja de ser valido
    this.clienteForm.controls.documento.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.clienteEncontrado = null;
    });
  }

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarPedidosRecientes();
  }

  cargarProductos(): void {
    this.productoService.listarProductos().subscribe({
      next: (prods) => {
        this.productosDisponibles = prods;
        this.cdr.detectChanges();
      },
    });
  }

  cargarPedidosRecientes(): void {
    this.pedidoService.listarPedidos().subscribe({
      next: (pedidos) => {
        this.pedidosRecientes = pedidos;
        this.cdr.detectChanges();
      },
    });
  }

  get documentoEsRuc(): boolean {
    return Patrones.RUC.test((this.clienteForm.controls.documento.value ?? '').trim());
  }

  buscarCliente(): void {
    const control = this.clienteForm.controls.documento;
    if (control.invalid) {
      control.markAsTouched();
      this.toastService.show('Ingrese un DNI (8 dígitos) o RUC (11 dígitos) válido para buscar al cliente.', 'warning');
      return;
    }
    const documento = (control.value ?? '').trim();

    this.usuarioService.buscarPorDocumento(documento).subscribe({
      next: (usuario) => {
        this.clienteEncontrado = usuario;
        if (Patrones.RUC.test(documento)) {
          // busqueda por ruc: ese ruc se usa para la factura del pedido
          this.clienteForm.controls.clienteRuc.setValue(documento);
        } else if (!this.clienteForm.controls.clienteRuc.value && usuario.dni) {
          this.clienteForm.controls.clienteRuc.setValue(`10${usuario.dni}9`);
        }
        this.toastService.show(`Cliente encontrado: ${usuario.nombre} ${usuario.apellido}`, 'success');
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.clienteEncontrado = null;
        this.toastService.show(err.error?.message || 'No se encontró cliente con ese documento.', 'danger');
        this.cdr.detectChanges();
      },
    });
  }

  onCambioProducto(): void {
    const id = this.productoForm.controls.idProducto.value;
    const prod = this.productosDisponibles.find((p) => p.idProducto === Number(id));
    if (prod) {
      this.productoForm.controls.precio.setValue(prod.precioReferencial);
    }
  }

  agregarProductoAlPedido(): void {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      this.toastService.show('Seleccione un producto e ingrese una cantidad y precio válidos.', 'warning');
      return;
    }

    const { idProducto, cantidad, precio } = this.productoForm.getRawValue();
    const prod = this.productosDisponibles.find((p) => p.idProducto === Number(idProducto));
    if (!prod) return;

    const cant = Number(cantidad);
    const precioUnit = Number(precio);
    const existente = this.carrito.find((item) => item.producto.idProducto === prod.idProducto);

    if (existente) {
      if (existente.cantidad + cant > Limites.CANTIDAD_MAX) {
        this.toastService.show(`La cantidad por producto no puede superar ${Limites.CANTIDAD_MAX}.`, 'warning');
        return;
      }
      existente.cantidad += cant;
      existente.precioUnitario = precioUnit;
      existente.subtotal = Number((existente.cantidad * existente.precioUnitario).toFixed(2));
    } else {
      this.carrito.push({
        producto: prod,
        cantidad: cant,
        precioUnitario: precioUnit,
        subtotal: Number((cant * precioUnit).toFixed(2)),
      });
    }

    this.productoForm.reset({ idProducto: null, cantidad: 1, precio: null });
  }

  quitarItem(index: number): void {
    this.carrito.splice(index, 1);
  }

  get subtotalBruto(): number {
    return this.carrito.reduce((acc, item) => acc + item.subtotal, 0);
  }

  get montoDescuentoCalculado(): number {
    const bruto = this.subtotalBruto;
    const { tipoDescuento, valorDescuento } = this.liquidacionForm.getRawValue();
    const valor = Number(valorDescuento ?? 0);
    if (bruto <= 0 || !valor || valor <= 0) return 0;
    if (tipoDescuento === 'MONTO_FIJO') {
      return Math.min(bruto, valor);
    }
    const porc = Math.min(100, valor);
    return Number(((bruto * porc) / 100).toFixed(2));
  }

  get totalPagar(): number {
    return Math.max(0, Number((this.subtotalBruto - this.montoDescuentoCalculado).toFixed(2)));
  }

  confirmarRegistroPedido(): void {
    const documento = (this.clienteForm.controls.documento.value ?? '').trim();
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      this.toastService.show('Revise el documento del cliente y el RUC de la factura.', 'warning');
      return;
    }
    // con ruc es obligatorio haber buscado al cliente (su ruc se usa en la factura)
    if (this.documentoEsRuc && !this.clienteEncontrado) {
      this.toastService.show('Busque al cliente por RUC antes de registrar el pedido.', 'warning');
      return;
    }
    if (this.carrito.length === 0) {
      this.toastService.show('Agregue al menos un producto al pedido.', 'warning');
      return;
    }
    if (this.liquidacionForm.invalid) {
      this.liquidacionForm.markAllAsTouched();
      this.toastService.show('Revise el valor del descuento.', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Está seguro de registrar el pedido?',
      text: `Total a pagar: S/ ${this.totalPagar.toFixed(2)}`,
      showCancelButton: true,
      cancelButtonText: 'No',
      confirmButtonText: 'Si',
      confirmButtonColor: '#000080',
      cancelButtonColor: '#b5b4b4',
      focusCancel: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.registrarPedido(documento);
      }
    });
  }

  private registrarPedido(documento: string): void {
    this.registrando = true;
    this.cdr.detectChanges();
    const sesion = this.sessionService.getInfoSession();
    const { clienteRuc } = this.clienteForm.getRawValue();
    const { tipoDescuento, valorDescuento, emitirFacturaElectronica } = this.liquidacionForm.getRawValue();

    // el backend acepta dni o ruc en documentoCliente: se envia el documento con el que se busco
    const documentoCliente = documento;

    const request: PedidoRequest = {
      idCliente: this.clienteEncontrado?.idUsuario,
      documentoCliente,
      clienteRuc: clienteRuc?.trim() || undefined,
      idVendedor: sesion?.usuarioId || undefined,
      idSucursal: 1,
      tipoDescuento,
      valorDescuento: Number(valorDescuento) || 0,
      emitirFacturaElectronica,
      lineas: this.carrito.map((item) => ({
        idProducto: item.producto.idProducto,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
      })),
    };

    this.pedidoService.registrarPedido(request).subscribe({
      next: (res) => {
        this.registrando = false;
        this.ultimoPedidoRegistrado = res.object;
        Swal.fire({
          icon: 'success',
          title: 'Registrar pedido',
          text: res.message || `¡Se registró exitosamente el pedido ${res.object?.codigoPedido ?? ''}!`,
          confirmButtonColor: '#000080',
        });
        if (res.object?.notificacionAlmacen) {
          this.toastService.show(res.object.notificacionAlmacen, 'info', 5000);
        }
        this.carrito = [];
        this.liquidacionForm.controls.valorDescuento.setValue(0);
        this.cargarPedidosRecientes();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.registrando = false;
        Swal.fire({
          icon: 'error',
          title: 'Registrar pedido',
          text: err.error?.message || '¡Ha ocurrido un error al registrar el pedido!',
          confirmButtonColor: '#b5b4b4',
        });
        this.cdr.detectChanges();
      },
    });
  }
}
