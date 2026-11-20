import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaseChartDirective, provideCharts } from 'ng2-charts';
import {
  ChartConfiguration,
  ChartData,
  Filler,
  Legend,
  LineController,
  LineElement,
  PointElement,
  PolarAreaController,
  ArcElement,
  RadarController,
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { DashboardService } from '../../services/dashboard.service';
import { ToastService } from '../../services/toast.service';

// colores del tema (dorado/vino)
const DORADO = '#d4b475';
const VINO = '#8b1e3f';
const TEXTO = '#e9e2d0';
const REJILLA = 'rgba(255, 255, 255, 0.12)';
const PALETA_ESTADOS = ['#d4b475', '#8b1e3f', '#4f8a8b', '#c97b3d', '#6c8e3a', '#7a5ea8', '#b5b4b4'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BaseChartDirective],
  // solo se registran los controladores usados: linea, radar y polar area (ningun pie ni bar)
  providers: [
    provideCharts({
      registerables: [
        LineController, LineElement, PointElement, CategoryScale, LinearScale, Filler,
        RadarController, RadialLinearScale,
        PolarAreaController, ArcElement,
        Legend, Tooltip,
      ],
    }),
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  opcionesDias: number[] = [7, 30, 90];
  diasControl = new FormControl<number>(30, { nonNullable: true, validators: [Validators.required] });

  // 1. linea: ventas diarias
  ventasData: ChartData<'line'> = { labels: [], datasets: [] };
  ventasOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { labels: { color: TEXTO } } },
    scales: {
      x: { ticks: { color: TEXTO }, grid: { color: REJILLA } },
      y: { beginAtZero: true, ticks: { color: TEXTO }, grid: { color: REJILLA }, title: { display: true, text: 'S/', color: TEXTO } },
      y1: { beginAtZero: true, position: 'right', ticks: { color: TEXTO, precision: 0 }, grid: { drawOnChartArea: false }, title: { display: true, text: 'Pedidos', color: TEXTO } },
    },
  };

  // 2. radar: stock actual vs minimo por categoria
  stockData: ChartData<'radar'> = { labels: [], datasets: [] };
  stockOptions: ChartConfiguration<'radar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: TEXTO } } },
    scales: {
      r: {
        beginAtZero: true,
        angleLines: { color: REJILLA },
        grid: { color: REJILLA },
        pointLabels: { color: TEXTO },
        ticks: { color: TEXTO, backdropColor: 'transparent' },
      },
    },
  };

  // 3. polar area: pedidos por estado
  estadosData: ChartData<'polarArea'> = { labels: [], datasets: [] };
  estadosOptions: ChartConfiguration<'polarArea'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { color: TEXTO } } },
    scales: {
      r: { beginAtZero: true, grid: { color: REJILLA }, ticks: { color: TEXTO, backdropColor: 'transparent', precision: 0 } },
    },
  };

  ngOnInit(): void {
    this.cargarVentas();
    this.cargarStock();
    this.cargarEstados();
  }

  cargarVentas(): void {
    this.dashboardService.ventasDiarias(this.diasControl.value).subscribe({
      next: (ventas) => {
        this.ventasData = {
          labels: ventas.map((v) => v.fecha.substring(5)),
          datasets: [
            {
              label: 'Ventas (S/)',
              data: ventas.map((v) => v.total),
              borderColor: DORADO,
              backgroundColor: 'rgba(212, 180, 117, 0.25)',
              fill: true,
              tension: 0.3,
              yAxisID: 'y',
            },
            {
              label: 'N° pedidos',
              data: ventas.map((v) => v.pedidos),
              borderColor: VINO,
              backgroundColor: VINO,
              borderDash: [6, 4],
              tension: 0.3,
              yAxisID: 'y1',
            },
          ],
        };
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => this.mostrarError(err, 'ventas diarias'),
    });
  }

  cargarStock(): void {
    this.dashboardService.stockPorCategoria().subscribe({
      next: (stock) => {
        this.stockData = {
          labels: stock.map((s) => s.categoria),
          datasets: [
            {
              label: 'Stock actual',
              data: stock.map((s) => s.stockActual),
              borderColor: DORADO,
              backgroundColor: 'rgba(212, 180, 117, 0.3)',
              pointBackgroundColor: DORADO,
            },
            {
              label: 'Stock mínimo',
              data: stock.map((s) => s.stockMinimo),
              borderColor: VINO,
              backgroundColor: 'rgba(139, 30, 63, 0.3)',
              pointBackgroundColor: VINO,
            },
          ],
        };
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => this.mostrarError(err, 'stock por categoría'),
    });
  }

  cargarEstados(): void {
    this.dashboardService.pedidosPorEstado().subscribe({
      next: (estados) => {
        this.estadosData = {
          labels: estados.map((e) => e.estado),
          datasets: [
            {
              label: 'Pedidos',
              data: estados.map((e) => e.cantidad),
              backgroundColor: estados.map((_, i) => PALETA_ESTADOS[i % PALETA_ESTADOS.length] + 'cc'),
              borderColor: '#141210',
            },
          ],
        };
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => this.mostrarError(err, 'pedidos por estado'),
    });
  }

  private mostrarError(err: HttpErrorResponse, grafico: string): void {
    this.toastService.show(err.error?.message || `No se pudo cargar el gráfico de ${grafico}.`, 'danger');
  }
}

