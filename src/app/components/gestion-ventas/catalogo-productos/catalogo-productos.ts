import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { ProductoService } from '../../../services/producto.service';
import { ToastService } from '../../../services/toast.service';
import { Categoria, Marca, Producto } from '../../../model/producto';
import { Limites, Patrones } from '../../../util/patrones';

@Component({
  selector: 'app-catalogo-productos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxPaginationModule],
  templateUrl: './catalogo-productos.html',
  styleUrl: './catalogo-productos.scss',
})
export class CatalogoProductos implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  productos: Producto[] = [];
  categorias: Categoria[] = [];
  marcas: Marca[] = [];

  // formulario reactivo de filtros (HU03)
  filtroForm = new FormGroup({
    busquedaNombre: new FormControl('', [Validators.maxLength(Limites.BUSQUEDA_MAX), Validators.pattern(Patrones.BUSQUEDA)]),
    filtroCategoria: new FormControl<number | null>(null),
    filtroMarca: new FormControl<number | null>(null),
  });

  // paginacion con ngx-pagination (HU03)
  page: number = 1;
  itemsPorPagina: number = 6;

  ngOnInit(): void {
    this.cargarFiltrosIniciales();
    this.buscarProductos();
  }

  cargarFiltrosIniciales(): void {
    this.productoService.listarCategorias().subscribe({
      next: (cats) => {
        this.categorias = cats;
        this.cdr.detectChanges();
      },
    });
    this.productoService.listarMarcas().subscribe({
      next: (marcas) => {
        this.marcas = marcas;
        this.cdr.detectChanges();
      },
    });
  }

  buscarProductos(): void {
    if (this.filtroForm.invalid) {
      this.filtroForm.markAllAsTouched();
      return;
    }
    const { busquedaNombre, filtroCategoria, filtroMarca } = this.filtroForm.value;
    this.productoService
      .listarProductos(filtroCategoria ?? null, filtroMarca ?? null, (busquedaNombre ?? '').trim())
      .subscribe({
        next: (lista) => {
          this.productos = lista;
          this.page = 1;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.toastService.show(err.error?.message || 'Error al cargar el catálogo de productos desde Neon.', 'danger');
        },
      });
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({ busquedaNombre: '', filtroCategoria: null, filtroMarca: null });
    this.buscarProductos();
  }
}
