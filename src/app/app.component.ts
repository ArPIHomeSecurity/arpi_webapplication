import { Component, OnInit, ViewChild, TemplateRef, Inject, NgZone, ElementRef, Renderer2 } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSidenav } from '@angular/material/sidenav';
import { BehaviorSubject, fromEvent } from 'rxjs';

import { CountdownComponent } from 'ngx-countdown';
import { HumanizeDuration, HumanizeDurationLanguage } from 'humanize-duration-ts';
import { StatusBar } from '@capacitor/status-bar';

import { environment } from '@environments/environment';
import { Router } from '@angular/router';
import { VERSION } from './version';
import { ROLE_TYPES } from './models';
import { AuthenticationService, LoaderService, MonitoringService } from './services';
import { AUTHENTICATION_SERVICE } from './tokens';
import { ThemeService } from './services/theme.service';
import { QuestionDialogComponent } from './components/question-dialog/question-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit {
  @ViewChild('sidenav') sidenav: MatSidenav;
  @ViewChild('counter') private countdown: CountdownComponent;

  // display error message of the components
  displayLoader = false;
  disablePage = false;
  message: string = null;

  locations: { name: string; id: string }[] = [];
  selectedLocationId: string;

  locales = [
    { name: 'Magyar', id: 'hu' },
    { name: 'English', id: 'en' },
    { name: 'Italiano', id: 'it' }
  ];
  currentLocale: string;
  versions: {
    serverVersion: string;
    webapplicationVersion: string;
  };

  isMultiLocation = environment.isMultiLocation;
  demoMode = environment.demo;

  countdownConfig = {
    leftTime: environment.userTokenExpiry,
    format: 'mm:ss',
    notify: [environment.userTokenExpiry / 3]
  };
  isSessionValid: boolean;
  isDeviceRegistered = false;

  langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
  humanizer: HumanizeDuration = new HumanizeDuration(this.langService);

  // theming
  width$ = new BehaviorSubject<number>(1000);
  resizeObserver!: ResizeObserver;
  smallScreen: boolean;

  darkTheme;

  constructor(
    @Inject(AUTHENTICATION_SERVICE) public authenticationService: AuthenticationService,
    @Inject('LoaderService') private loader: LoaderService,
    @Inject('MonitoringService') private monitoring: MonitoringService,
    @Inject('ThemeService') private themeService: ThemeService,
    public router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,

    private renderer: Renderer2,
    private host: ElementRef,
    private zone: NgZone
  ) {
    this.currentLocale = localStorage.getItem('localeId');

    if (!this.currentLocale) {
      this.currentLocale = 'en';
    }

    this.versions = { serverVersion: '', webapplicationVersion: VERSION };
    this.isSessionValid = false;
  }

  async ngOnInit() {
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
        this.themeService.updateSize(false);
        if (this.sidenav) {
          this.sidenav.opened = true;
          this.sidenav.mode = 'side';
          this.sidenav.disableClose = true;
        }
      } else {
        this.smallScreen = true;
        this.themeService.updateSize(true);
        if (this.sidenav) {
          this.sidenav.opened = false;
          this.sidenav.mode = 'over';
          this.sidenav.disableClose = false;
        }
      }
    });

    this.loader.displayed.subscribe(value => (this.displayLoader = value));
    this.loader.disabled.subscribe(value => (this.disablePage = value));
    this.loader.message.subscribe(message => (this.message = message));
    this.monitoring.getVersion().subscribe(version => (this.versions.serverVersion = version));
    this.authenticationService.isSessionValid().subscribe(isSessionValid => {
      this.isSessionValid = isSessionValid;
      if (this.isSessionValid && this.countdown) {
        this.countdown.restart();
      }
    });

    this.authenticationService.isDeviceRegistered().subscribe(isRegistered => {
      this.isDeviceRegistered = isRegistered;
    });

    const locations = JSON.parse(localStorage.getItem('locations')) || [];
    this.locations = locations.sort((a, b) => a.order - b.order).map(i => ({ name: i.name, id: i.id }));

    this.selectedLocationId = localStorage.getItem('selectedLocationId');

    fromEvent(window, 'storage').subscribe(this.onConfigurationChanged.bind(this));

    // update navigation bar for edge-to-edge
    const isEdgeToEdge = await this.isEdgeToEdgeEnabled();
    if (isEdgeToEdge) {
      console.log('Edge-to-edge enabled, update padding');
      // update the style of the mat-toolbar
      const toolbar = document.querySelector('mat-toolbar');
      this.renderer.setStyle(toolbar, 'padding-top', '40px');
      this.renderer.setStyle(toolbar, 'height', '90px');

      // update the style of the page-wrapper
      const pageWrapper = document.querySelector('.page-wrapper');
      this.renderer.setStyle(pageWrapper, 'min-height', 'calc(100vh - 96px)');

      // update the style of the all-wrapper
      const allWrapper = document.querySelector('.all-wrap');
      this.renderer.setStyle(allWrapper, 'min-height', 'calc(100vh - 96px)');
    }
  }

  async isEdgeToEdgeEnabled(): Promise<boolean> {
    try {
      // This checks if the web content extends into the system UI areas
      const statusBarInfo = await StatusBar.getInfo();
      return statusBarInfo.overlays;
    } catch (error) {
      return false;
    }
  }

  isLoggedIn() {
    return this.authenticationService.isLoggedIn();
  }

  logout(manualAction: boolean) {
    this.countdown.stop();
    this.authenticationService.logout(manualAction);
  }

  getUserName() {
    return this.authenticationService.getUsername();
  }

  isAdminUser() {
    return this.authenticationService.getRole() === ROLE_TYPES.ADMIN;
  }

  getLocationName() {
    if (this.selectedLocationId !== null) {
      const location = this.locations.find(i => i.id === this.selectedLocationId);
      if (location) {
        return location.name;
      }
    }

    return '';
  }

  getBackend() {
    const backendScheme = localStorage.getItem('backend.scheme');
    const backendDomain = localStorage.getItem('backend.domain');
    const backendPort = localStorage.getItem('backend.port');
    return `${backendScheme}://${backendDomain}:${backendPort}`;
  }

  onConfigurationChanged(event: StorageEvent) {
    if (event.key === 'locations') {
      const locations = JSON.parse(event.newValue);
      this.locations = locations.sort((a, b) => a.order - b.order).map(i => ({ name: i.name, id: i.id }));
    } else if (event.key === 'selectedLocationId') {
      this.selectedLocationId = event.newValue;
    }
  }

  onLocationChange(event) {
    this.selectedLocationId = event.value;
    localStorage.setItem('selectedLocationId', event.value);

    // navigate to the default page and reload the page
    localStorage.removeItem('returnUrl');
    this.router.navigate(['/']).then(() => window.location.reload());
  }

  onLocaleSelected(event) {
    const currentLocale = localStorage.getItem('localeId');
    console.log('Change locale: ', currentLocale, '=>', event.value);
    localStorage.setItem('localeId', event.value);

    const newLocale = event.value;
    const pathParser = new RegExp('^(?<version>/v\\d*-?[a-zA-Z]*)?/(?<language>[a-z]{2})/(?<path>.*)$');

    // replace the language in the path
    const path = window.location.pathname;
    const matches = pathParser.exec(path);
    if (matches !== null) {
      const newPath = [matches.groups.version, newLocale, matches.groups.path].join('/');
      console.log('Redirect to ' + newPath);
      window.location.pathname = newPath;
    } else {
      console.error('No match found for path: ', path);
    }
  }

  onThemeSwitched($event) {
    console.log('Theme switched: ', $event.checked);
    this.themeService.updateTheme($event.checked ? 'argus-dark-theme' : 'argus-light-theme');
  }

  handleCountdown($event) {
    if ($event.action === 'notify') {
      this.snackBar.open($localize`:@@session expiry:Your session will expire in ${this.getSessionDuration()}!`, null, {
        duration: environment.snackDuration
      });
    } else if ($event.action === 'done') {
      this.snackBar.open($localize`:@@session expired:Your session expired, logged out!`, null, {
        duration: environment.snackDuration
      });
      this.logout(false);
    }
  }

  getSessionDuration() {
    let currentLocale = localStorage.getItem('localeId');
    if (!currentLocale) {
      currentLocale = 'en';
    }
    return this.humanizer.humanize((environment.userTokenExpiry / 3) * 1000, { language: currentLocale });
  }

  unregister() {
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      width: '250px',
      data: {
        title: $localize`:@@unregister device:Unregister device`,
        message: $localize`:@@unregister device message:Are you sure you want to unregister this device?`,
        options: [
          {
            id: 'ok',
            text: $localize`:@@unregister:Unregister`,
            color: 'warn'
          },
          {
            id: 'cancel',
            text: $localize`:@@cancel:Cancel`
          }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'ok') {
        this.authenticationService.unRegisterDevice();
      }
    });
  }

  openHelp() {
    // get current path
    const currentPath = location.pathname;

    // remove version and language from the path
    const pathParser = new RegExp('^(?<version>/v\\d*-?[a-zA-Z]*)?/(?<language>[a-z]{2})/(?<path>.*)$');
    const matches = pathParser.exec(currentPath);
    let pathWithoutLanguage = '';
    if (matches !== null) {
      pathWithoutLanguage = matches.groups.path;
    }

    // mapping of local urls to documentation urls
    const urlMap = {
      '': 'en/latest/end_users/',
      login: 'en/latest/end_users/login/',
      events: 'en/latest/end_users/events/',

      areas: 'en/latest/end_users/areas/',
      area: 'en/latest/end_users/areas/#edit-area',
      outputs: 'en/latest/end_users/outputs/',
      output: 'en/latest/end_users/outputs/#edit-output',
      sensors: 'en/latest/end_users/sensors/',
      sensor: 'en/latest/end_users/sensors/#edit-area',
      users: 'en/latest/end_users/users/',
      user: 'en/latest/end_users/users/#edit-user',
      zones: 'en/latest/end_users/zones/',
      zone: 'en/latest/end_users/zones/#edit-zone',

      'config/syren': 'en/latest/end_users/syren/',
      'config/keypad': 'en/latest/end_users/keypad/',
      'config/notifications/': 'en/latest/end_users/notifications/',
      'config/network': 'en/latest/end_users/network/',
      'config/clock': 'en/latest/end_users/clock/'
    };

    if (environment.isMultiLocation) {
      urlMap['setup'] = 'en/latest/end_users/locations/';
    } else {
      urlMap['setup'] = 'en/latest/end_users/setup/';
    }

    if (!(pathWithoutLanguage in urlMap)) {
      console.error('No mapping found for: ' + pathWithoutLanguage);
      pathWithoutLanguage = '';
    }

    console.debug('Mapping: ' + pathWithoutLanguage + ' => ' + urlMap[pathWithoutLanguage]);
    // check if documentation path exists
    const http = new XMLHttpRequest();
    const url = 'https://docs.arpi-security.info/' + urlMap[pathWithoutLanguage];
    http.open('HEAD', url, false);

    try {
      http.send();
    } catch (error) {
      if (http.status === 404) {
        // fallback to main page
        pathWithoutLanguage = '';
      }
    }

    // TODO:
    // * select documentation language
    // * select documentation version

    // open the documentation in a new window
    const documentationUrl = 'https://docs.arpi-security.info/';
    window.open(documentationUrl + urlMap[pathWithoutLanguage], 'arpi-docs');
  }
}
