// animation for material design
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { CountdownModule } from 'ngx-countdown';

// application components
import { LoginComponent } from './pages/login';
import { HomeComponent } from './pages/home';
import { ClockComponent } from './pages/config/clock';
import { NotificationsComponent, SmsMessagesDialogComponent } from './pages/config/notifications';
import { NetworkComponent } from './pages/config/network';
import { SyrenComponent } from './pages/config/syren';
import { KeypadComponent } from './pages/config/keypad';
import { SensorListComponent, SensorDetailComponent, SensorDeleteDialogComponent } from './pages/sensor';
import { ZoneListComponent, ZoneDetailComponent, ZoneDeleteDialogComponent } from './pages/zone';
import { AreaListComponent, AreaDetailComponent, AreaDeleteDialogComponent } from './pages/area';
import {
  UserListComponent,
  UserDetailComponent,
  UserDeleteDialogComponent,
  UserDeviceRegistrationDialogComponent,
  UserDeviceUnregisterDialogComponent,
  UserCardDeleteDialogComponent,
  UserSshKeySetupDialogComponent
} from './pages/user';
import { SystemStateComponent } from './components/system-state/system-state.component';

import { AppHttpInterceptor } from './app.http.interceptor';
import { AreaComponent, ControllerComponent, OutputComponent, SensorComponent } from './components';
import { AUTHENTICATION_SERVICE } from './tokens';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { DemoComponent } from './demo/demo.component';
import { DemoHelpDialogComponent } from './demo/demo.help.dialog.component';
import { DigitOnlyModule } from '@uiowa/digit-only';
import { EventsComponent } from './pages/events/events.component';
import { OutputDeleteDialogComponent, OutputDetailComponent, OutputListComponent } from './pages/output';
import { PageNotFoundComponent } from './page-not-found.component';
import { routing } from './app.routing';
import { ThemeService } from './services/theme.service';

import { environment } from '@environments/environment';

import { DragDropModule } from '@angular/cdk/drag-drop';

// material components
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
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
    ControllerComponent,

    KeypadComponent,
    ClockComponent,
    NotificationsComponent,
    SmsMessagesDialogComponent,
    NetworkComponent,
    SyrenComponent,
    
    UserCardDeleteDialogComponent,
    UserListComponent,
    UserDetailComponent,
    UserDeleteDialogComponent,
    UserDeviceRegistrationDialogComponent,
    UserDeviceUnregisterDialogComponent,
    UserSshKeySetupDialogComponent,

    AreaComponent,
    AreaListComponent,
    AreaDetailComponent,
    AreaDeleteDialogComponent,

    OutputComponent,
    OutputListComponent,
    OutputDetailComponent,
    OutputDeleteDialogComponent,

    SensorComponent,
    SensorListComponent,
    SensorDetailComponent,
    SensorDeleteDialogComponent,

    ZoneListComponent,
    ZoneDetailComponent,
    ZoneDeleteDialogComponent,

    SystemStateComponent,
    PageNotFoundComponent,

    DemoComponent,
    DemoHelpDialogComponent,
    EventsComponent
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    ClipboardModule,
    CountdownModule,
    DigitOnlyModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    
    routing,

    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatExpansionModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTableModule,
    MatToolbarModule,
    MatTooltipModule,

    DragDropModule
  ],
  providers: [
    {provide: 'ThemeService', useClass: ThemeService},
    {provide: 'AlertService', useClass: environment.alertService},
    {provide: 'AreaService', useClass: environment.areaService},
    {provide: 'ArmService', useClass: environment.armService},
    {provide: AUTHENTICATION_SERVICE, useClass: environment.authenticationService},
    {provide: 'CardService', useClass: environment.cardService},
    {provide: 'ConfigurationService', useClass: environment.configurationService},
    {provide: 'EventService', useClass: environment.eventService},
    {provide: 'KeypadService', useClass: environment.keypadService},
    {provide: 'LoaderService', useClass: environment.loaderService},
    {provide: 'MonitoringService', useClass: environment.monitoringService},
    {provide: 'OutputService', useClass: environment.outputService},
    {provide: 'SensorService', useClass: environment.sensorService},
    {provide: 'UserService', useClass: environment.userService},
    {provide: 'ZoneService', useClass: environment.zoneService},

    {
      provide: HTTP_INTERCEPTORS,
      useClass: AppHttpInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
