import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { MediaChange, ObservableMedia } from '@angular/flex-layout';
import { Subscription } from 'rxjs';

import { AuthenticationService, LoaderService, MonitoringService } from './services/index';

import { environment } from '../environments/environment';
import { VERSION } from './version';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  displayLoader: boolean;
  watcher: Subscription;
  small_screen: boolean;
  alert: boolean;
  locales = [
    {name: 'Magyar', id: 'hu'},
    {name: 'English', id: 'en'}
  ];
  currentLocale: string;
  server_version: string;
  webapplication_version = VERSION;
  environment = environment;

  constructor(
          public media: ObservableMedia,
          private loader: LoaderService,
          public authService: AuthenticationService,
          private monitoring: MonitoringService,
          private sidenav: ViewContainerRef
  ) {
    this.watcher = media.subscribe((change: MediaChange) => {
      this.small_screen = (change.mqAlias === 'xs' || change.mqAlias === 'sm');
    });

    this.currentLocale = localStorage.getItem('localeId');

    if (!this.currentLocale) {
      this.currentLocale = 'en';
    }
  }

  ngOnInit() {
    this.displayLoader = false;
    this.small_screen = (this.media.isActive('xs') || this.media.isActive('sm'));
    this.loader.status.subscribe(value => {
      this.displayLoader = value;
    });
    this.monitoring.getVersion().subscribe(version => this.server_version = version);
  }

  isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  logout() {
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
}
