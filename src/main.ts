import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import * as moment from 'moment';


let locale = localStorage.getItem('localeId');
console.log('Selected language: ', locale);
moment.locale(locale);
if (locale === null) {
  locale = 'en';
}

console.log('Current location: ', location.pathname);
var localeRegex = new RegExp('^/([a-z]{2})/');
var matches = localeRegex.exec(location.pathname);

console.log('Current locale: ', matches === null ? 'en' : matches[1]);

if ((matches === null && locale === 'en') || (matches !== null && locale === matches[1])) {
  console.log('Correct locale, no need to redirect!');

}
else if (matches === null && locale != 'en') {
  // redirect to locale (EN => X)
  const newPath = locale + location.pathname;
  console.log('Redirect to ' + newPath);
  location.pathname = newPath;
}
else if (matches !== null && locale == 'en') {
  // redirect to locale (X => EN)
  const newPath = location.pathname.replace(matches[0], '/');
  console.log('Redirect to ' + newPath);
  location.pathname = newPath;
}

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
