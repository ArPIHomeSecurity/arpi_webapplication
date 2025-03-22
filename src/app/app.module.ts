// animation for material design
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { CountdownModule } from 'ngx-countdown';

// application components
import { BackendErrorComponent } from './pages/backend-error/backend-error.component';
import { LoginComponent } from './pages/login';
import { HomeComponent } from './pages/home';
import { ClockComponent } from './pages/config/clock';
import { NotificationsComponent, SmsMessagesDialogComponent } from './pages/config/notifications';
import { NetworkComponent } from './pages/config/network';
import { SyrenComponent } from './pages/config/syren';
import { KeypadComponent } from './pages/config/keypad';
import { SensorListComponent, SensorDetailComponent } from './pages/sensor';
import { ZoneListComponent, ZoneDetailComponent } from './pages/zone';
import { AreaListComponent, AreaDetailComponent } from './pages/area';
import { LocationListComponent, LocationDetailsComponent } from './pages/location';
import { UserListComponent, UserDetailComponent } from './pages/user';
import { SystemStateComponent } from './components/system-state/system-state.component';
import { UserCardComponent } from './components/user/user-card/user-card.component';
import { MyUserComponent } from './pages/my-user/my-user.component';
import { MessageComponent } from './components/message/message.component';
import { QuestionDialogComponent } from './components/question-dialog/question-dialog.component';
import { UserDeviceRegistrationDialogComponent } from './components/user/user-device-registration/user-device-registration.component';
import { UserSshKeySetupDialogComponent } from './components/user/user-ssh-key-setup/user-ssh-key-setup.component';

import { AppHttpInterceptor } from './app.http.interceptor';
import { AreaComponent, ControllerComponent, OutputComponent, SensorComponent } from './components';
import { AUTHENTICATION_SERVICE } from './tokens';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { DemoComponent } from './demo/demo.component';
import { DemoHelpDialogComponent } from './demo/demo.help.dialog.component';
import { DigitOnlyModule } from '@uiowa/digit-only';
import { EventsComponent } from './pages/events/events.component';
import { OutputDetailComponent, OutputListComponent } from './pages/output';
import { PageNotFoundComponent } from './page-not-found.component';
import { routing } from './app.routing';
import { ThemeService } from './services/theme.service';

import { configureBackend } from './utils';
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
import { CapacitorService } from './services/capacitor.service';
import { LongPressToggleDirective } from './directives';


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
    { provide: AUTHENTICATION_SERVICE, useClass: environment.authenticationService },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AppHttpInterceptor,
      multi: true
    },
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => configureBackend,
    },
  ]
})
export class AppModule { }
