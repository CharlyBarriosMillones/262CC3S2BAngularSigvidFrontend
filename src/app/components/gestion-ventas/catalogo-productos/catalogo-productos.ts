import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../services/producto.service';
import { ToastService } from '../../../services/toast.service';
import { Categoria, Marca, Producto } from '../../../model/producto';

@Component({
  selector: 'app-catalogo-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  filtroCategoria: number | null = null;
  filtroMarca: number | null = null;
  busquedaNombre: string = '';

  // Paginación (HU03)
  paginaActual: number = 1;
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
    this.productoService
      .listarProductos(this.filtroCategoria, this.filtroMarca, this.busquedaNombre)
      .subscribe({
        next: (lista) => {
          this.productos = lista;
          this.paginaActual = 1;
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastService.show('Error al cargar el catálogo de productos desde Neon.', 'danger');
        },
      });
  }

  limpiarFiltros(): void {
    this.filtroCategoria = null;
    this.filtroMarca = null;
    this.busquedaNombre = '';
    this.buscarProductos();
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.productos.length / this.itemsPorPagina));
  }

  get paginasArray(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  get productosPaginados(): Producto[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.productos.slice(inicio, inicio + this.itemsPorPagina);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }
}