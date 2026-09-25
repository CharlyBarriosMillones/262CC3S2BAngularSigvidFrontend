import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Corchos } from './corchos';

describe('Corchos', () => {
  let component: Corchos;
  let fixture: ComponentFixture<Corchos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Corchos],
    }).compileComponents();

    fixture = TestBed.createComponent(Corchos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
