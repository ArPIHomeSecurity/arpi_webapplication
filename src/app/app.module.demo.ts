// animation for material desing
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
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
import { UserListComponent, UserDetailComponent, UserDeleteDialogComponent, UserDeviceRegistrationDialogComponent } from './user';
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
import { routing } from './app.routing';
import { PageNotFoundComponent } from './page-not-found.component';

// material components
import {
  MatInputModule,
  MatToolbarModule,
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
  MatTooltipModule
} from '@angular/material';

import { DemoComponent } from './demo/demo.component';
import { DemoHelpDialogComponent } from './demo/demo.help.dialog.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    AlertListComponent,
    ZoneListComponent,
    ZoneDetailComponent,
    ZoneDeleteDialogComponent,

    KeypadComponent,
    ClockComponent,
    NotificationsComponent,
    NetworkComponent,

    UserListComponent,
    UserDetailComponent,
    UserDeleteDialogComponent,
    UserDeviceRegistrationDialogComponent,

    SensorListComponent,
    SensorDetailComponent,
    SensorDeleteDialogComponent,
    SystemStateComponent,
    PageNotFoundComponent,
    DemoComponent,
    DemoHelpDialogComponent
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
    ZoneDeleteDialogComponent,
    DemoHelpDialogComponent
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
    ZoneService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
