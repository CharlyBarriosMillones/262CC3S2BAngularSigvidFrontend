import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmarRecepcion } from './confirmar-recepcion';

describe('ConfirmarRecepcion', () => {
  let component: ConfirmarRecepcion;
  let fixture: ComponentFixture<ConfirmarRecepcion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmarRecepcion],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmarRecepcion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
