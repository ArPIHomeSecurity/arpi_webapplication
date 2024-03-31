import { TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';

import { AppComponent } from './app.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { SystemStateComponent } from './components/indicators/system-state.component';
import { environment } from '@environments/environment.demo';


describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FlexLayoutModule,
        HttpClientModule,
        RouterTestingModule,
        MatIconModule,
        MatListModule,
        MatSelectModule,
        MatSidenavModule,
        MatSnackBarModule,
        MatToolbarModule
      ],
      providers: [
        {provide: 'AlertService', useClass: environment.alertService},
        {provide: 'AuthenticationService', useClass: environment.authenticationService},
        {provide: 'ConfigurationService', useClass: environment.configurationService},
        {provide: 'EventService', useClass: environment.eventService},
        {provide: 'KeypadService', useClass: environment.keypadService},
        {provide: 'LoaderService', useClass: environment.loaderService},
        {provide: 'MonitoringService', useClass: environment.monitoringService},
        {provide: 'SensorService', useClass: environment.sensorService},
        {provide: 'UserService', useClass: environment.userService},
        {provide: 'ZoneService', useClass: environment.zoneService},
      ],
      declarations: [
        AppComponent,
        SystemStateComponent,

        MatSidenav
      ],
    }).compileComponents();
  }));

  it('should create the app', waitForAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});
