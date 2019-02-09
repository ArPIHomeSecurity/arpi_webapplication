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

// user authentication
import { AuthGuard, AdminGuard } from './guards/index';
import { LoginComponent } from './login/index';
import { HomeComponent } from './home/index';
import { AlertListComponent } from './alert/index';
import { ClockComponent } from './config/clock/index';
import { NotificationsComponent } from './config/notifications/index';
import { NetworkComponent } from './config/network/index';
import { SensorListComponent, SensorDetailComponent, SensorDeleteDialog } from './sensor/index';
import { ZoneListComponent, ZoneDetailComponent, ZoneDeleteDialog } from './zone/index';
import { UserListComponent, UserDetailComponent, UserDeleteDialog } from './user/index';
import { SystemStateComponent } from './indicators/system-state.component';
import {
  AlertService,
  AuthenticationService,
  ConfigurationService,
  EventService,
  LoaderService,
  MonitoringService,
  SensorService,
  ZoneService,
  UserService
} from './services/index';
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
  MatProgressSpinnerModule
} from '@angular/material';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    AlertListComponent,
    ZoneListComponent,
    ZoneDetailComponent,
    ZoneDeleteDialog,

    ClockComponent,
    NotificationsComponent,
    NetworkComponent,

    UserListComponent,
    UserDetailComponent,
    UserDeleteDialog,

    SensorListComponent,
    SensorDetailComponent,
    SensorDeleteDialog,
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

    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    TimezonePickerModule
  ],
  entryComponents: [
    SensorDeleteDialog,
    UserDeleteDialog,
    ZoneDeleteDialog
  ],
  providers: [
    AlertService,
    AuthGuard,
    AdminGuard,

    AlertService,
    AuthenticationService,
    ConfigurationService,
    EventService,
    LoaderService,
    MonitoringService,
    SensorService,
    UserService,
    ZoneService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
