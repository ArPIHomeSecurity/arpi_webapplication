import { Component, OnInit, ViewChild, TemplateRef, Inject, NgZone, ElementRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSidenav } from '@angular/material/sidenav';
import { BehaviorSubject, Subscription } from 'rxjs';

import { CountdownComponent } from 'ngx-countdown';
import { HumanizeDuration, HumanizeDurationLanguage } from 'humanize-duration-ts';

import { VERSION } from './version';
import { ROLE_TYPES } from './models';
import { environment } from '@environments/environment';
import { AuthenticationService, LoaderService, MonitoringService } from './services';
import { UserDeviceUnregisterDialogComponent } from './pages/user';
import { Router } from '@angular/router';
import { AUTHENTICATION_SERVICE } from './tokens';
import { ThemeService } from './services/theme.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;
  @ViewChild('sidenav') sidenav: MatSidenav;
  @ViewChild('counter') private countdown: CountdownComponent;

  // display error message of the components
  displayLoader = false;
  disablePage = false;
  message: string = null;

  watcher: Subscription;
  smallScreen: boolean;
  locales = [
    {name: 'Magyar', id: 'hu'},
    {name: 'English', id: 'en'},
    {name: 'Italiano', id: 'it'}
  ];
  currentLocale: string;
  versions: {
    serverVersion: string;
    webapplicationVersion: string;
  };
  environment = environment;
  countdownConfig = {
    leftTime: environment.userTokenExpiry,
    format: 'mm:ss',
    notify: [environment.userTokenExpiry / 3],
  };
  isSessionValid: boolean;
  isDeviceRegistered = false;

  langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
  humanizer: HumanizeDuration = new HumanizeDuration(this.langService);

  width$ = new BehaviorSubject<number>(1000);
  resizeObserver!: ResizeObserver;

  darkTheme;

  constructor(
    @Inject(AUTHENTICATION_SERVICE) public authenticationService: AuthenticationService,
    @Inject('LoaderService') private loader: LoaderService,
    @Inject('MonitoringService') private monitoring: MonitoringService,
    @Inject('ThemeService') private themeService: ThemeService,
    public router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    
    private host: ElementRef,
    private zone: NgZone
  ) {
    this.currentLocale = localStorage.getItem('localeId');

    if (!this.currentLocale) {
      this.currentLocale = 'en';
    }

    this.versions = {serverVersion: '', webapplicationVersion: VERSION};
    this.isSessionValid = false;
  }
  
  ngOnInit() {
    this.darkTheme = this.themeService.load();

    this.resizeObserver = new ResizeObserver(entries => {
      this.zone.run(() => {
        this.width$.next(entries[0].contentRect.width);
      });
    });
    this.resizeObserver.observe(this.host.nativeElement);

    this.width$.subscribe(width => {
      if (width > 640) {
        this.smallScreen = false;
        if (this.sidenav) {
          this.sidenav.opened = true;
          this.sidenav.mode = 'side';
          this.sidenav.disableClose = true;
        }
      } else {
        this.smallScreen = true;
        if (this.sidenav) {
          this.sidenav.opened = false;
          this.sidenav.mode = 'over';
          this.sidenav.disableClose = false;
        }
      }
    })

    this.loader.displayed.subscribe(value => this.displayLoader = value);
    this.loader.disabled.subscribe(value => this.disablePage = value);
    this.loader.message.subscribe(message => this.message = message);
    this.monitoring.getVersion().subscribe(version => this.versions.serverVersion = version);
    this.authenticationService.isSessionValid()
      .subscribe(isSessionValid => {
        this.isSessionValid = isSessionValid;
        if (this.isSessionValid && this.countdown) {
          this.countdown.restart();
        }
      });

    this.authenticationService.isDeviceRegistered()
      .subscribe(isRegistered => {
        this.isDeviceRegistered = isRegistered;
      });
  }

  isLoggedIn() {
    return this.authenticationService.isLoggedIn();
  }

  logout() {
    this.countdown.stop();
    this.authenticationService.logout();
  }

  getUserName() {
    return this.authenticationService.getUsername();
  }

  isAdminUser() {
    return this.authenticationService.getRole() === ROLE_TYPES.ADMIN;
  }

  onLocaleSelected(event) {
    const currentLocale = localStorage.getItem('localeId');
    console.log('Change locale: ', currentLocale, '=>', event.value);
    localStorage.setItem('localeId', event.value);

    const newLocale = event.value === environment.defaultLanguage ? '' : event.value;
    const languagePattern = new RegExp('^/(' + environment.languages.split(' ').join('|') + ')/');
    if (languagePattern.test(location.pathname)) {
      // change the language
      const newPath = location.pathname.replace('/' + currentLocale, (newLocale ? '/' + newLocale : ''));
      location.pathname = newPath.replace(/\/$/, '');
    } else {
      // if the current language isn't the default, add the language
      location.pathname = ('/' + newLocale + location.pathname)
    }
  }

  onThemeSwitched($event) {
    console.log('Theme switched: ', $event.checked);
    this.themeService.update($event.checked ? 'argus-dark-theme' : 'argus-light-theme');
  }

  handleCountdown($event) {
    if ($event.action === 'notify') {
      this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration});
    } else if ($event.action === 'done') {
      this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration});
      this.logout();
    }
  }

  getSessionDuration() {
    let currentLocale = localStorage.getItem('localeId');
    if (!currentLocale) {
      currentLocale = 'en';
    }
    return this.humanizer.humanize((environment.userTokenExpiry/3)*1000, { language: currentLocale });
  }

  unregister() {
    const dialogRef = this.dialog.open(UserDeviceUnregisterDialogComponent, {
      width: '250px',
      data: null,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authenticationService.unRegisterDevice();
      }
    });
  }

  openHelp() {
    // get current path
    const currentPath = window.location.pathname;
    
    // remove language from path
    var currentLocale = localStorage.getItem('localeId');
    if (currentLocale == environment.defaultLanguage) {
      currentLocale = '/';
    }
    else {
      currentLocale = '/' + currentLocale + '/';
    }

    // remove language prefix
    var pathWithoutLanguage = currentPath.replace(currentLocale, '');
    // remove leading slash
    pathWithoutLanguage.replace(/^\/+/g, "");

    // get text before first slash
    var firstSlash = pathWithoutLanguage.indexOf('/');
    if (firstSlash > 0) {
      pathWithoutLanguage = pathWithoutLanguage.substring(0, firstSlash);
    }

    // mapping of local urls to documentation urls
    const urlMap = {
      '': 'en/latest/end_users/',
      'login': 'en/latest/end_users/login/',
      'events': 'en/latest/end_users/events/',
      
      'areas': 'en/latest/end_users/areas/',
      'area': 'en/latest/end_users/areas/#edit-area',
      'sensors': 'en/latest/end_users/sensors/',
      'sensor': 'en/latest/end_users/sensors/#edit-area',
      'zones': 'en/latest/end_users/zones/',
      'zone': 'en/latest/end_users/zones/#edit-zone',

      'config/syren': 'en/latest/end_users/syren/',
      'config/keypad': 'en/latest/end_users/keypad/',
      'config/notifications/': 'en/latest/end_users/notifications/',
      'config/network': 'en/latest/end_users/network/',
      'config/clock': 'en/latest/end_users/clock/',
      
      'users': 'en/latest/end_users/users/',
      'user': 'en/latest/end_users/users/#edit-user'
    }

    console.debug("Mapping: "+pathWithoutLanguage+ " => "+urlMap[pathWithoutLanguage])
    // check if documentation path exists
    const http = new XMLHttpRequest();
    const url = 'https://docs.arpi-security.info/' + urlMap[pathWithoutLanguage];
    http.open('HEAD', url, false);
    http.send();
    if (http.status === 404) {
      // fallback to main page
      pathWithoutLanguage = '';
    }

    // TODO:
    // * select documentation language
    // * select documentation version

    // open the documentation in a new window
    const documentationUrl = 'https://docs.arpi-security.info/'
    window.open(documentationUrl + urlMap[pathWithoutLanguage], 'arpi-docs');
  }
}
