import { Component, OnInit, ViewChild, ViewContainerRef, AfterViewInit } from '@angular/core';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CountdownComponent } from 'ngx-countdown';

import * as humanizeDuration from 'humanize-duration';

import { Subscription } from 'rxjs';

import { AuthenticationService, LoaderService, MonitoringService } from './services';

import { environment } from '../environments/environment';
import { VERSION } from './version';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('counter') private countdown: CountdownComponent;

  displayLoader: boolean;
  // display error message of the compoponents
  message: string;
  watcher: Subscription;
  small_screen: boolean;
  locales = [
    {name: 'Magyar', id: 'hu'},
    {name: 'English', id: 'en'}
  ];
  currentLocale: string;
  versions: {
    server_version: string;
    webapplication_version: string;
  }
  environment = environment;
  countdownConfig = {
    leftTime: environment.USER_TOKEN_EXPIRY,
    format: 'mm:ss',
    notify: [environment.USER_TOKEN_EXPIRY/3]
  };
  isSessionValid: boolean;
  
  constructor(
    public mediaObserver: MediaObserver,
    private loader: LoaderService,
    public authService: AuthenticationService,
    private monitoring: MonitoringService,
    private sidenav: ViewContainerRef,
    private snackBar: MatSnackBar
  ) {
    this.watcher = mediaObserver.media$.subscribe((change: MediaChange) => {
      this.small_screen = (change.mqAlias === 'xs' || change.mqAlias === 'sm');
    });

    this.currentLocale = localStorage.getItem('localeId');

    if (!this.currentLocale) {
      this.currentLocale = 'en';
    }

    this.versions = {server_version: '', webapplication_version: VERSION};
    this.isSessionValid = false;
  }

  ngOnInit() {
    this.small_screen = (this.mediaObserver.isActive('xs') || this.mediaObserver.isActive('sm'));
    this.loader.status.subscribe(value => this.displayLoader = value);
    this.loader.message.subscribe(message => this.message = message);
    this.monitoring.getVersion().subscribe(version => this.versions.server_version = version);
  }
  
  ngAfterViewInit(){
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

  // helper method to access the sidenav even if it is in ngIf
  @ViewChild('sidenav') set setSidenav(sidenav: ViewContainerRef) {
      this.sidenav = sidenav;
  }

  onLocaleSelected(event) {
    const current_locale = localStorage.getItem('localeId');
    console.log('Change locale: ', current_locale, '=>', event.value);
    localStorage.setItem('localeId', event.value);

    if (environment.aotTranslations) {
      const new_locale = event.value === environment.DEFAULT_LANGUAGE ? '' : event.value;
      const languagePattern = new RegExp('^/(' + environment.LANGUAGES.split(' ').join('|') + ')/');
      if (languagePattern.test(location.pathname)) {
        // change the language
        location.pathname = location.pathname.replace('/' + current_locale, (new_locale ? '/' + new_locale : ''));
      } else {
        // if the current language isn't the default, add the language
        location.pathname = '/' + new_locale + location.pathname;
      }
    } else {
      location.reload();
    }
  }

  handleCountdown($event) {
    if ($event.action == 'notify') {
      const current_locale = localStorage.getItem('localeId');
      this.snackBar.open('You session will expirey in ' + humanizeDuration((environment.USER_TOKEN_EXPIRY/3)*1000, {language: current_locale})+'!', null, {duration: environment.SNACK_DURATION});
    }
    else if ($event.action == 'done') {
      this.snackBar.open('Session expired, logged out!', null, {duration: environment.SNACK_DURATION});
      this.logout();
    }
  }
}
