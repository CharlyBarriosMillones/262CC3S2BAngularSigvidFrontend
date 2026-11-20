import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { StockService } from '../../../services/stock.service';
import { ProductoService } from '../../../services/producto.service';
import { ToastService } from '../../../services/toast.service';
import { Categoria } from '../../../model/producto';
import { AlmacenResponse, StockResponse, Ubigeo } from '../../../model/stock';
import { Limites, Patrones } from '../../../util/patrones';

@Component({
  selector: 'app-consultar-stock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxPaginationModule],
  templateUrl: './consultar-stock.html',
  styleUrl: './consultar-stock.scss',
})
export class ConsultarStock implements OnInit {
  private readonly stockService = inject(StockService);
  private readonly productoService = inject(ProductoService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  filtroForm = new FormGroup({
    termino: new FormControl('', [
      Validators.maxLength(Limites.BUSQUEDA_MAX),
      Validators.pattern(Patrones.BUSQUEDA),
    ]),
    idCategoria: new FormControl<number | null>(null),
    idAlmacen: new FormControl<number | null>(null),
    idUbigeo: new FormControl<string | null>(null),
    estado: new FormControl<string | null>(null),
  });

  stockArray: StockResponse[] = [];
  categorias: Categoria[] = [];
  almacenes: AlmacenResponse[] = [];
  ubigeos: Ubigeo[] = [];
  estados: string[] = ['OK', 'Bajo', 'Crítico'];

  page: number = 1;
  confirmandoId: number | null = null;

  ngOnInit(): void {
    this.cargarCatalogosFiltro();
    this.buscarStock();
  }

  cargarCatalogosFiltro(): void {
    this.productoService.listarCategorias().subscribe({
      next: (cats) => {
        this.categorias = cats;
        this.cdr.detectChanges();
      },
    });
    this.stockService.listarAlmacenes().subscribe({
      next: (alms) => {
        this.almacenes = alms;
        this.cdr.detectChanges();
      },
    });
    this.stockService.listarUbigeos().subscribe({
      next: (ubis) => {
        this.ubigeos = ubis;
        this.cdr.detectChanges();
      },
    });
  }

  buscarStock(): void {
    if (this.filtroForm.invalid) {
      this.filtroForm.markAllAsTouched();
      return;
    }
    const filtros = this.filtroForm.getRawValue();
    this.stockService.consultarStock(filtros).subscribe({
      next: (lista) => {
        this.stockArray = lista;
        this.page = 1;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.toastService.show(err.error?.message || 'Error al consultar el stock.', 'danger');
      },
    });
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({
      termino: '',
      idCategoria: null,
      idAlmacen: null,
      idUbigeo: null,
      estado: null,
    });
    this.buscarStock();
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'OK':
        return 'bg-success';
      case 'Bajo':
        return 'bg-warning text-dark';
      case 'Crítico':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  confirmarStock(item: StockResponse): void {
    this.confirmandoId = item.idStock;
    this.stockService.confirmarStock(item.idStock).subscribe({
      next: (res) => {
        this.confirmandoId = null;
        if (res.object) {
          const idx = this.stockArray.findIndex((s) => s.idStock === item.idStock);
          if (idx !== -1) {
            this.stockArray[idx] = res.object;
          }
        }
        this.toastService.show(res.message || 'Stock confirmado.', 'success');
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.confirmandoId = null;
        this.toastService.show(err.error?.message || 'No se pudo confirmar el stock.', 'danger');
        this.cdr.detectChanges();
      },
    });
  }
}