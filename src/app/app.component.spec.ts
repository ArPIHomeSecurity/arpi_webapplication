import { TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';

import { AppComponent } from './app.component';
import { SystemStateComponent } from './components/system-state/system-state.component';
import { AUTHENTICATION_SERVICE } from './tokens';
import { environment } from '@environments/environment.demo';
import { ThemeService } from './services';
import { MatMenuModule } from '@angular/material/menu';


describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        SystemStateComponent
      ],
      imports: [BrowserAnimationsModule,
        MatIconModule,
        MatListModule,
        MatMenuModule,
        MatSelectModule,
        MatSidenavModule,
        MatSnackBarModule,
        MatToolbarModule],
      providers: [
        { provide: 'AlertService', useClass: environment.alertService },
        { provide: 'ArmService', useClass: environment.armService },
        { provide: 'AreaService', useClass: environment.areaService },
        { provide: AUTHENTICATION_SERVICE, useClass: environment.authenticationService },
        { provide: 'ConfigurationService', useClass: environment.configurationService },
        { provide: 'EventService', useClass: environment.eventService },
        { provide: 'KeypadService', useClass: environment.keypadService },
        { provide: 'LoaderService', useClass: environment.loaderService },
        { provide: 'MonitoringService', useClass: environment.monitoringService },
        { provide: 'SensorService', useClass: environment.sensorService },
        { provide: 'ThemeService', useClass: ThemeService },
        { provide: 'UserService', useClass: environment.userService },
        { provide: 'ZoneService', useClass: environment.zoneService },
        provideHttpClient(withInterceptorsFromDi()),
      ]
    }).compileComponents();
  }));

  it('should create the app', waitForAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});
