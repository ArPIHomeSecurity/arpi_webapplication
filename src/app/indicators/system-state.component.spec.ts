import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemStateComponent } from './system-state.component';

describe('SystemStateComponent', () => {
  let component: SystemStateComponent;
  let fixture: ComponentFixture<SystemStateComponent>;

  beforeEach(async(() => {
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
