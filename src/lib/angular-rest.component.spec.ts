import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AngularRestComponent } from './angular-rest.component';

describe('AngularRestComponent', () => {
  let component: AngularRestComponent;
  let fixture: ComponentFixture<AngularRestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AngularRestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AngularRestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
