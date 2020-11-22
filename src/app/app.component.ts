import { Component, OnInit, ViewChild, TemplateRef, Inject } from '@angular/core';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSidenav } from '@angular/material/sidenav';
import { Subscription } from 'rxjs';

import { CountdownComponent } from 'ngx-countdown';
import { HumanizeDuration, HumanizeDurationLanguage } from 'humanize-duration-ts';

import { VERSION } from './version';
import { ROLE_TYPES } from './models';
import { environment } from '../environments/environment';
import { AuthenticationService, LoaderService, MonitoringService } from './services';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('snacbarTemplate') snackbarTemplate: TemplateRef<any>;
  @ViewChild('sidenav') sidenav: MatSidenav;
  @ViewChild('counter') private countdown: CountdownComponent;

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

  langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
  humanizer: HumanizeDuration = new HumanizeDuration(this.langService);

  constructor(
    @Inject('AuthenticationService') public authService: AuthenticationService,
    @Inject('LoaderService') private loader: LoaderService,
    @Inject('MonitoringService') private monitoring: MonitoringService,
    public mediaObserver: MediaObserver,
    private snackBar: MatSnackBar
  ) {

    this.currentLocale = localStorage.getItem('localeId');

    if (!this.currentLocale) {
      this.currentLocale = 'en';
    }

    this.versions = {serverVersion: '', webapplicationVersion: VERSION};
    this.isSessionValid = false;
  }

  ngOnInit() {
    this.watcher = this.mediaObserver.asObservable().subscribe((changes: MediaChange[]) => {
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

    this.smallScreen = (this.mediaObserver.isActive('xs') || this.mediaObserver.isActive('sm'));
    this.loader.status.subscribe(value => this.displayLoader = value);
    this.loader.message.subscribe(message => this.message = message);
    this.monitoring.getVersion().subscribe(version => this.versions.serverVersion = version);
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
    return this.authService.getRole() === ROLE_TYPES.ADMIN;
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
      location.pathname = ('/' + newLocale + location.pathname).replace(/\/$/, '');
    }
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
}
