import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';


let locale = localStorage.getItem('localeId');
// console.log('Selected language: ', locale);
if (locale === null) {
  locale = 'en';
}

// console.log('Current location: ', location.pathname);
if (location.pathname.startsWith('/' + locale)) {
  // console.log('Correct locale, no need to redirect!');
} else if (locale !== 'en') {
  // console.log('Other locale is selected => redirect', locale);
  location.href = ('/' + locale + location.pathname).replace(/\/$/, '');
}

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
