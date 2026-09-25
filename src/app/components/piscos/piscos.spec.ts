import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Piscos } from './piscos';

describe('Piscos', () => {
  let component: Piscos;
  let fixture: ComponentFixture<Piscos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Piscos],
    }).compileComponents();

    fixture = TestBed.createComponent(Piscos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
