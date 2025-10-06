// animation for material design
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ClipboardModule } from '@angular/cdk/clipboard';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule, provideAppInitializer } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
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
import { BrowserModule } from '@angular/platform-browser';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { environment } from '@environments/environment';
import { DigitOnlyModule } from '@uiowa/digit-only';
import { CountdownModule } from 'ngx-countdown';
import { AppComponent } from './app.component';

// application components
import { MessageComponent } from './components/message/message.component';
import { QuestionDialogComponent } from './components/question-dialog/question-dialog.component';
import { SystemStateComponent } from './components/system-state/system-state.component';
import { UserCardComponent } from './components/user/user-card/user-card.component';
import { UserDeviceRegistrationDialogComponent } from './components/user/user-device-registration/user-device-registration.component';
import { UserSshKeySetupDialogComponent } from './components/user/user-ssh-key-setup/user-ssh-key-setup.component';
import { AreaDetailComponent, AreaListComponent } from './pages/area';
import { BackendErrorComponent } from './pages/backend-error/backend-error.component';
import { ClockComponent } from './pages/config/clock';
import { KeypadComponent } from './pages/config/keypad';
import { NetworkComponent } from './pages/config/network';
import { NotificationsComponent, SmsMessagesDialogComponent } from './pages/config/notifications';
import { SyrenComponent } from './pages/config/syren';
import { HomeComponent } from './pages/home';
import { LocationDetailsComponent, LocationListComponent } from './pages/location';
import { LoginComponent } from './pages/login';
import { MyUserComponent } from './pages/my-user/my-user.component';
import { SensorDetailComponent, SensorListComponent } from './pages/sensor';
import { UserDetailComponent, UserListComponent } from './pages/user';
import { ZoneDetailComponent, ZoneListComponent } from './pages/zone';

import { AppHttpInterceptor } from './app.http.interceptor';
import { routing } from './app.routing';
import { AreaComponent, ControllerComponent, OutputComponent, SensorComponent } from './components';
import { DemoComponent } from './demo/demo.component';
import { DemoHelpDialogComponent } from './demo/demo.help.dialog.component';
import { PageNotFoundComponent } from './page-not-found.component';
import { EventsComponent } from './pages/events/events.component';
import { OutputDetailComponent, OutputListComponent } from './pages/output';
import { ThemeService } from './services/theme.service';
import { AUTHENTICATION_SERVICE } from './tokens';

import { configureBackend } from './utils';

// material components
import { LongPressToggleDirective } from './directives';
import { CapacitorService } from './services/capacitor.service';

@NgModule({
  declarations: [
    AppComponent,
    BackendErrorComponent,
    LoginComponent,
    HomeComponent,
    ControllerComponent,
    QuestionDialogComponent,
    MessageComponent,

    KeypadComponent,
    ClockComponent,
    NotificationsComponent,
    SmsMessagesDialogComponent,
    NetworkComponent,
    SyrenComponent,

    UserCardComponent,
    UserListComponent,
    UserDetailComponent,
    UserDeviceRegistrationDialogComponent,
    UserSshKeySetupDialogComponent,
    MyUserComponent,

    AreaComponent,
    AreaListComponent,
    AreaDetailComponent,

    LocationDetailsComponent,
    LocationListComponent,

    OutputComponent,
    OutputListComponent,
    OutputDetailComponent,

    SensorComponent,
    SensorListComponent,
    SensorDetailComponent,

    ZoneListComponent,
    ZoneDetailComponent,

    SystemStateComponent,
    PageNotFoundComponent,

    DemoComponent,
    DemoHelpDialogComponent,
    EventsComponent
  ],
  bootstrap: [AppComponent],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    ClipboardModule,
    CountdownModule,
    DigitOnlyModule,
    FormsModule,

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

    DragDropModule,

    LongPressToggleDirective
  ],
  providers: [
    { provide: AUTHENTICATION_SERVICE, useClass: environment.authenticationService },
    { provide: 'AlertService', useClass: environment.alertService },
    { provide: 'AreaService', useClass: environment.areaService },
    { provide: 'ArmService', useClass: environment.armService },
    { provide: 'BiometricService', useClass: environment.biometricService },
    { provide: 'CapacitorService', useClass: CapacitorService },
    { provide: 'CardService', useClass: environment.cardService },
    { provide: 'ConfigurationService', useClass: environment.configurationService },
    { provide: 'EventService', useClass: environment.eventService },
    { provide: 'KeypadService', useClass: environment.keypadService },
    { provide: 'LoaderService', useClass: environment.loaderService },
    { provide: 'MonitoringService', useClass: environment.monitoringService },
    { provide: 'OutputService', useClass: environment.outputService },
    { provide: 'SensorService', useClass: environment.sensorService },
    { provide: 'ThemeService', useClass: ThemeService },
    { provide: 'UserService', useClass: environment.userService },
    { provide: 'ZoneService', useClass: environment.zoneService },
    { provide: HTTP_INTERCEPTORS, useClass: AppHttpInterceptor, multi: true },
    provideHttpClient(withInterceptorsFromDi()),
    provideAppInitializer(configureBackend),
  ]
})
export class AppModule {}
