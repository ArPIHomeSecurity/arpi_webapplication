// animation for material desing
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';

import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { TimezonePickerModule } from 'ng2-timezone-selector';
import { CountdownModule } from 'ngx-countdown';

// user authentication
import { AuthGuard, AdminGuard } from './guards';
import { LoginComponent } from './login';
import { HomeComponent } from './home';
import { AlertListComponent } from './alert';
import { ClockComponent } from './config/clock';
import { NotificationsComponent } from './config/notifications';
import { NetworkComponent } from './config/network';
import { KeypadComponent } from './keypad';
import { SensorListComponent, SensorDetailComponent, SensorDeleteDialogComponent } from './sensor';
import { ZoneListComponent, ZoneDetailComponent, ZoneDeleteDialogComponent } from './zone';
import { 
  UserListComponent,
  UserDetailComponent,
  UserDeleteDialogComponent,
  UserDeviceRegistrationDialogComponent,
  UserDeviceUnregisterDialogComponent
} from './user';
import { SystemStateComponent } from './indicators/system-state.component';
import {
  AlertService,
  AuthenticationService,
  ConfigurationService,
  EventService,
  KeypadService,
  LoaderService,
  MonitoringService,
  SensorService,
  UserService,
  ZoneService
} from './services';
import { AppHttpInterceptor } from './app.http.interceptor';
import { routing } from './app.routing';
import { PageNotFoundComponent } from './page-not-found.component';

// material components
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    
    AlertListComponent,
    
    KeypadComponent,
    ClockComponent,
    NotificationsComponent,
    NetworkComponent,
    
    UserListComponent,
    UserDetailComponent,
    UserDeleteDialogComponent,
    UserDeviceRegistrationDialogComponent,
    UserDeviceUnregisterDialogComponent,
    
    SensorListComponent,
    SensorDetailComponent,
    SensorDeleteDialogComponent,
    
    ZoneListComponent,
    ZoneDetailComponent,
    ZoneDeleteDialogComponent,

    SystemStateComponent,
    PageNotFoundComponent
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    FlexLayoutModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    routing,
    MatInputModule,
    MatToolbarModule,
    MatTooltipModule,
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSlideToggleModule,
    MatButtonToggleModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatTableModule,
    MatChipsModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatDialogModule,
    MatProgressSpinnerModule,

    CountdownModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    TimezonePickerModule
  ],
  entryComponents: [
    SensorDeleteDialogComponent,
    UserDeleteDialogComponent,
    UserDeviceRegistrationDialogComponent,
    UserDeviceUnregisterDialogComponent,
    ZoneDeleteDialogComponent
  ],
  providers: [
    AlertService,
    AuthGuard,
    AdminGuard,

    AlertService,
    AuthenticationService,
    ConfigurationService,
    EventService,
    KeypadService,
    LoaderService,
    MonitoringService,
    SensorService,
    UserService,
    ZoneService,

    {
      provide: HTTP_INTERCEPTORS,
      useClass: AppHttpInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
