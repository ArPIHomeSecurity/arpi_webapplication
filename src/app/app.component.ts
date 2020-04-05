import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSidenav } from '@angular/material/sidenav';
import { Subscription } from 'rxjs';

import { CountdownComponent } from 'ngx-countdown';
import * as humanizeDuration from 'humanize-duration';


import { AuthenticationService, LoaderService, MonitoringService } from './services';

import { environment } from '../environments/environment';
import { VERSION } from './version';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('sidenav') sidenav: MatSidenav;
  @ViewChild('counter') private countdown: CountdownComponent;
  @ViewChild('snacbarTemplate') snackbarTemplate: TemplateRef<any>;

  displayLoader: boolean;
  // display error message of the compoponents
  message: string;
  watcher: Subscription;
  smallScreen: boolean;
  locales = [
    {name: 'Magyar', id: 'hu'},
    {name: 'English', id: 'en'}
  ];
  currentLocale: string;
  versions: {
    server_version: string;
    webapplication_version: string;
  };
  environment = environment;
  countdownConfig = {
    leftTime: environment.USER_TOKEN_EXPIRY,
    format: 'mm:ss',
    notify: [environment.USER_TOKEN_EXPIRY / 3],
  };
  isSessionValid: boolean;

  constructor(
    public mediaObserver: MediaObserver,
    private loader: LoaderService,
    public authService: AuthenticationService,
    private monitoring: MonitoringService,
    private snackBar: MatSnackBar
  ) {
    this.watcher = mediaObserver.asObservable().subscribe((changes: MediaChange[]) => {
      this.smallScreen = false;
      changes.forEach(change => this.smallScreen = this.smallScreen || (change.mqAlias === 'lt-sm'));

      if (this.smallScreen) {
        this.sidenav.opened = false;
        this.sidenav.mode = 'over';
        this.sidenav.disableClose = false;
      } else {
        this.sidenav.opened = true;
        this.sidenav.mode = 'side';
        this.sidenav.disableClose = true;
      }
    });

    this.currentLocale = localStorage.getItem('localeId');

    if (!this.currentLocale) {
      this.currentLocale = 'en';
    }

    this.versions = {server_version: '', webapplication_version: VERSION};
    this.isSessionValid = false;
  }

  ngOnInit() {
    this.smallScreen = (this.mediaObserver.isActive('xs') || this.mediaObserver.isActive('sm'));
    this.loader.status.subscribe(value => this.displayLoader = value);
    this.loader.message.subscribe(message => this.message = message);
    this.monitoring.getVersion().subscribe(version => this.versions.server_version = version);
    this.authService.isSessionValid()
      .subscribe(isSessionValid => {
        this.isSessionValid = isSessionValid;
        if (this.isSessionValid && this.countdown) {
          this.countdown.restart();
        }
      });
  }

  isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  logout() {
    this.countdown.stop();
    this.authService.logout();
  }

  getUserName() {
    return this.authService.getUsername();
  }

  isAdminUser() {
    return this.authService.getRole() === environment.ROLE_TYPES.ADMIN;
  }

  onLocaleSelected(event) {
    const currentLocale = localStorage.getItem('localeId');
    console.log('Change locale: ', currentLocale, '=>', event.value);
    localStorage.setItem('localeId', event.value);

    const newLocale = event.value === environment.DEFAULT_LANGUAGE ? '' : event.value;
    const languagePattern = new RegExp('^/(' + environment.LANGUAGES.split(' ').join('|') + ')/');
    if (languagePattern.test(location.pathname)) {
      // change the language
      const newPath = location.pathname.replace('/' + currentLocale, (newLocale ? '/' + newLocale : ''));
      location.pathname = newPath.replace(/\/$/, '');
    } else {
      // if the current language isn't the default, add the language
      location.pathname = ('/' + newLocale + location.pathname).replace(/\/$/, '');
    }
  }

  handleCountdown($event) {
    if ($event.action === 'notify') {
      this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.SNACK_DURATION});
    } else if ($event.action === 'done') {
      this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.SNACK_DURATION});
      this.logout();
    }
  }

  getSessionDuration() {
    let currentLocale = localStorage.getItem('localeId');
    if (!currentLocale) {
    currentLocale = 'en';
    }
    return humanizeDuration((environment.USER_TOKEN_EXPIRY/3)*1000, { language: currentLocale });
  }
}
