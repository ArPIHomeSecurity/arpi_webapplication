import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackendErrorComponent } from './backend-error.component';

describe('BackendErrorComponent', () => {
  let component: BackendErrorComponent;
  let fixture: ComponentFixture<BackendErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BackendErrorComponent ],
      imports: []
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackendErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
