import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignarPedido } from './asignar-pedido';

describe('AsignarPedido', () => {
  let component: AsignarPedido;
  let fixture: ComponentFixture<AsignarPedido>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignarPedido],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignarPedido);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
