import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SystemStateComponent } from './system-state.component';

describe('SystemStateComponent', () => {
  let component: SystemStateComponent;
  let fixture: ComponentFixture<SystemStateComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SystemStateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SystemStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
