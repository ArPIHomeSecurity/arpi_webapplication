// animation for material desing
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';

import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { CountdownModule } from 'ngx-countdown';

// user authentication
import { AuthGuard, AdminGuard } from './guards';
import { LoginComponent } from './login';
import { HomeComponent } from './home';
import { ClockComponent } from './config/clock';
import { NotificationsComponent } from './config/notifications';
import { NetworkComponent } from './config/network';
import { SyrenComponent } from './config/syren';
import { KeypadComponent } from './keypad';
import { SensorListComponent, SensorDetailComponent, SensorDeleteDialogComponent } from './sensor';
import { ZoneListComponent, ZoneDetailComponent, ZoneDeleteDialogComponent } from './zone';
import { AreaListComponent, AreaDetailComponent, AreaDeleteDialogComponent } from './area';
import {
  UserListComponent,
  UserDetailComponent,
  UserDeleteDialogComponent,
  UserDeviceRegistrationDialogComponent,
  UserDeviceUnregisterDialogComponent,
  UserCardDeleteDialogComponent,
} from './user';
import { SystemStateComponent } from './indicators/system-state.component';

import { AppHttpInterceptor } from './app.http.interceptor';
import { routing } from './app.routing';
import { PageNotFoundComponent } from './page-not-found.component';
import { DemoComponent } from './demo/demo.component';
import { DemoHelpDialogComponent } from './demo/demo.help.dialog.component';
import { environment } from 'src/environments/environment';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { DigitOnlyModule } from '@uiowa/digit-only';
import { AreaComponent, SensorComponent } from './components';

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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EventsComponent } from './events/events.component';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { DragDropModule } from '@angular/cdk/drag-drop';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,

    KeypadComponent,
    ClockComponent,
    NotificationsComponent,
    NetworkComponent,
    SyrenComponent,

    UserCardDeleteDialogComponent,
    UserListComponent,
    UserDetailComponent,
    UserDeleteDialogComponent,
    UserDeviceRegistrationDialogComponent,
    UserDeviceUnregisterDialogComponent,

    AreaComponent,

    SensorComponent,
    SensorListComponent,
    SensorDetailComponent,
    SensorDeleteDialogComponent,

    AreaListComponent,
    AreaDetailComponent,
    AreaDeleteDialogComponent,

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
    FlexLayoutModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    
    routing,

    MatAutocompleteModule,
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatPaginatorModule,

    DragDropModule
  ],
  providers: [
    AuthGuard,
    AdminGuard,

    {provide: 'AreaService', useClass: environment.areaService},
    {provide: 'AlertService', useClass: environment.alertService},
    {provide: 'ArmService', useClass: environment.armService},
    {provide: 'AuthenticationService', useClass: environment.authenticationService},
    {provide: 'CardService', useClass: environment.cardService},
    {provide: 'ConfigurationService', useClass: environment.configurationService},
    {provide: 'EventService', useClass: environment.eventService},
    {provide: 'KeypadService', useClass: environment.keypadService},
    {provide: 'LoaderService', useClass: environment.loaderService},
    {provide: 'MonitoringService', useClass: environment.monitoringService},
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
