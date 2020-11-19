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
import { ServiceTypes } from 'src/environments/environment.demo';
import { FlexLayoutModule } from '@angular/flex-layout';
import { SystemStateComponent } from './indicators/system-state.component';


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
        {provide: 'AlertService', useClass: ServiceTypes.alertService},
        {provide: 'AuthenticationService', useClass: ServiceTypes.authenticationService},
        {provide: 'ConfigurationService', useClass: ServiceTypes.configurationService},
        {provide: 'EventService', useClass: ServiceTypes.eventService},
        {provide: 'KeypadService', useClass: ServiceTypes.keypadService},
        {provide: 'LoaderService', useClass: ServiceTypes.loaderService},
        {provide: 'MonitoringService', useClass: ServiceTypes.monitoringService},
        {provide: 'SensorService', useClass: ServiceTypes.sensorService},
        {provide: 'UserService', useClass: ServiceTypes.userService},
        {provide: 'ZoneService', useClass: ServiceTypes.zoneService},
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
