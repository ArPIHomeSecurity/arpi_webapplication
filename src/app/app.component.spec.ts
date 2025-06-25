import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, RouterOutlet } from '@angular/router';

import { MockAuthenticationService, MockMonitoringService, MockUserService } from 'testing';

import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';

import { AppComponent } from './app.component';
import { SystemStateComponent } from './components/system-state/system-state.component';
import { ThemeService } from './services';
import { AUTHENTICATION_SERVICE } from './tokens';

import { environment } from '@environments/environment';


describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        SystemStateComponent
      ],
      imports: [
        BrowserAnimationsModule,
        MatIconModule,
        MatListModule,
        MatMenuModule,
        MatSelectModule,
        MatSidenavModule,
        MatSlideToggle,
        MatSnackBarModule,
        MatToolbarModule,
        RouterOutlet
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideNativeDateAdapter(),
        { provide: 'AlertService', useClass: environment.alertService },
        { provide: 'ArmService', useClass: environment.armService },
        { provide: 'AreaService', useClass: environment.areaService },
        { provide: AUTHENTICATION_SERVICE, useClass: MockAuthenticationService },
        { provide: 'ConfigurationService', useClass: environment.configurationService },
        { provide: 'EventService', useClass: environment.eventService },
        { provide: 'KeypadService', useClass: environment.keypadService },
        { provide: 'LoaderService', useClass: environment.loaderService },
        { provide: 'MonitoringService', useClass: MockMonitoringService },
        { provide: 'SensorService', useClass: environment.sensorService },
        { provide: 'ThemeService', useClass: ThemeService },
        { provide: 'UserService', useClass: MockUserService },
        { provide: 'ZoneService', useClass: environment.zoneService },
      ]
    }).compileComponents();
  }));

  it('should create the app', waitForAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});
