import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../services/producto.service';
import { PedidoService } from '../../../services/pedido.service';
import { UsuarioService } from '../../../services/usuario.service';
import { SessionService } from '../../../services/session.service';
import { ToastService } from '../../../services/toast.service';
import { Producto } from '../../../model/producto';
import { PedidoRequest, PedidoResponse } from '../../../model/pedido';

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

@Component({
  selector: 'app-registrar-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // Búsqueda de cliente por DNI / RUC (HU04)
  documentoBusqueda: string = '';
  clienteEncontrado: any | null = null;
  clienteRuc: string = '';

  // Selección de producto para agregar al pedido
  idProductoSeleccionado: number | null = null;
  cantidadProducto: number = 1;
  precioProducto: number = 0;

  carrito: ItemCarrito[] = [];

  // Descuento (porcentaje o monto fijo) y Factura SUNAT (HU04)
  tipoDescuento: 'PORCENTAJE' | 'MONTO_FIJO' = 'PORCENTAJE';
  valorDescuento: number = 0;
  emitirFacturaElectronica: boolean = true;

  ultimoPedidoRegistrado: PedidoResponse | null = null;
  registrando: boolean = false;

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

  buscarClientePorDni(): void {
    if (!this.documentoBusqueda || this.documentoBusqueda.trim().length < 8) {
      this.toastService.show('Ingrese un DNI válido de 8 dígitos para buscar al cliente.', 'warning');
      return;
    }

    this.usuarioService.buscarPorDocumento(this.documentoBusqueda.trim()).subscribe({
      next: (usuario) => {
        this.clienteEncontrado = usuario;
        if (!this.clienteRuc && usuario.dni) {
          this.clienteRuc = `10${usuario.dni}9`;
        }
        this.toastService.show(`Cliente encontrado: ${usuario.nombre} ${usuario.apellido}`, 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.clienteEncontrado = null;
        this.toastService.show(err.error?.message || 'No se encontró cliente con ese DNI.', 'danger');
        this.cdr.detectChanges();
      },
    });
  }

  onCambioProducto(): void {
    const prod = this.productosDisponibles.find((p) => p.idProducto === Number(this.idProductoSeleccionado));
    if (prod) {
      this.precioProducto = prod.precioReferencial;
    }
  }

  agregarProductoAlPedido(): void {
    if (!this.idProductoSeleccionado || this.cantidadProducto <= 0) {
      this.toastService.show('Seleccione un producto e ingrese una cantidad mayor a 0.', 'warning');
      return;
    }

    const prod = this.productosDisponibles.find((p) => p.idProducto === Number(this.idProductoSeleccionado));
    if (!prod) return;

    const precio = this.precioProducto > 0 ? this.precioProducto : prod.precioReferencial;
    const existente = this.carrito.find((item) => item.producto.idProducto === prod.idProducto);

    if (existente) {
      existente.cantidad += this.cantidadProducto;
      existente.precioUnitario = precio;
      existente.subtotal = Number((existente.cantidad * existente.precioUnitario).toFixed(2));
    } else {
      this.carrito.push({
        producto: prod,
        cantidad: this.cantidadProducto,
        precioUnitario: precio,
        subtotal: Number((this.cantidadProducto * precio).toFixed(2)),
      });
    }

    this.idProductoSeleccionado = null;
    this.cantidadProducto = 1;
    this.precioProducto = 0;
  }

  quitarItem(index: number): void {
    this.carrito.splice(index, 1);
  }

  get subtotalBruto(): number {
    return this.carrito.reduce((acc, item) => acc + item.subtotal, 0);
  }

  get montoDescuentoCalculado(): number {
    const bruto = this.subtotalBruto;
    if (bruto <= 0 || !this.valorDescuento || this.valorDescuento <= 0) return 0;
    if (this.tipoDescuento === 'MONTO_FIJO') {
      return Math.min(bruto, this.valorDescuento);
    }
    const porc = Math.min(100, this.valorDescuento);
    return Number(((bruto * porc) / 100).toFixed(2));
  }

  get totalPagar(): number {
    return Math.max(0, Number((this.subtotalBruto - this.montoDescuentoCalculado).toFixed(2)));
  }

  confirmarRegistroPedido(): void {
    if (!this.clienteEncontrado && (!this.documentoBusqueda || this.documentoBusqueda.trim().length < 8)) {
      this.toastService.show('Debe buscar y seleccionar un cliente por DNI antes de registrar el pedido.', 'warning');
      return;
    }
    if (this.carrito.length === 0) {
      this.toastService.show('Agregue al menos un producto al pedido.', 'warning');
      return;
    }

    this.registrando = true;
    const sesion = this.sessionService.getInfoSession();

    const request: PedidoRequest = {
      idCliente: this.clienteEncontrado?.idUsuario,
      documentoCliente: this.documentoBusqueda.trim(),
      clienteRuc: this.clienteRuc?.trim() || undefined,
      idVendedor: sesion?.usuarioId || undefined,
      idSucursal: 1,
      tipoDescuento: this.tipoDescuento,
      valorDescuento: this.valorDescuento || 0,
      emitirFacturaElectronica: this.emitirFacturaElectronica,
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
        this.toastService.show(res.message || 'Pedido registrado exitosamente.', 'success');
        if (res.object?.notificacionAlmacen) {
          this.toastService.show(res.object.notificacionAlmacen, 'info', 5000);
        }
        this.carrito = [];
        this.valorDescuento = 0;
        this.cargarPedidosRecientes();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.registrando = false;
        this.toastService.show(err.error?.message || 'Error al registrar el pedido.', 'danger');
        this.cdr.detectChanges();
      },
    });
  }
}