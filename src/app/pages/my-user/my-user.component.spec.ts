import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyUserComponent } from './my-user.component';

describe('MyUserComponent', () => {
  let component: MyUserComponent;
  let fixture: ComponentFixture<MyUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
