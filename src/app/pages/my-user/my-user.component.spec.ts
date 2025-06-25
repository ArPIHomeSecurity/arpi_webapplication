import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuModule } from '@angular/material/menu';

import { UserCardComponent } from '@app/components/user/user-card/user-card.component';
import { AUTHENTICATION_SERVICE } from '@app/tokens';
import { MyUserComponent } from './my-user.component';

import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '@environments/environment';
import { MockAuthenticationService, MockMonitoringService, MockUserService } from 'testing';


describe('MyUserComponent', () => {
  let component: MyUserComponent;
  let fixture: ComponentFixture<MyUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        MyUserComponent,
        UserCardComponent
      ],
      imports: [
        MatCardModule,
        MatDividerModule,
        MatIconModule,
        MatMenuModule,
        MatProgressSpinnerModule
      ],
      providers: [
        { provide: AUTHENTICATION_SERVICE, useClass: MockAuthenticationService },
        { provide: 'BiometricService', useClass: environment.biometricService },
        { provide: 'CardService', useClass: environment.cardService },
        { provide: 'EventService', useClass: environment.eventService },
        { provide: 'UserService', useClass: MockUserService },
        { provide: 'LoaderService', useClass: environment.loaderService },
        { provide: 'MonitoringService', useClass: MockMonitoringService },
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
