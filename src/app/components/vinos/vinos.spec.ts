import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Vinos } from './vinos';

describe('Vinos', () => {
  let component: Vinos;
  let fixture: ComponentFixture<Vinos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Vinos],
    }).compileComponents();

    fixture = TestBed.createComponent(Vinos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
