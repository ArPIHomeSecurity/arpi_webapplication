import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { MyUserComponent } from './my-user.component';
import { environment } from '@environments/environment';
import { AUTHENTICATION_SERVICE } from '@app/tokens';

describe('MyUserComponent', () => {
  let component: MyUserComponent;
  let fixture: ComponentFixture<MyUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyUserComponent ],
      imports: [],
      providers: [
        { provide: AUTHENTICATION_SERVICE, useClass: environment.authenticationService },
        { provide: 'EventService', useClass: environment.eventService },
        { provide: 'UserService', useClass: environment.userService },
        { provide: 'LoaderService', useClass: environment.loaderService },
        { provide: 'MonitoringService', useClass: environment.monitoringService },
        provideHttpClient(withInterceptorsFromDi()),
      ]
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
