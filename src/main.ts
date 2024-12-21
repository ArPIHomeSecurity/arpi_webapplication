import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import * as moment from 'moment';


let locale = localStorage.getItem('localeId');
console.log('Selected language: ', locale);
if (locale === null) {
  locale = 'en';
}

moment.locale(locale);

console.log('Current path: ', location.pathname);
const pathParser = new RegExp('^(?<version>/v\\d*-?[a-zA-Z]*)?/(?<language>[a-z]{2})/(?<path>.*)$');
const matches = pathParser.exec(location.pathname);

if (matches) {
  console.log('Path matches: ', matches);
  const newPath = [matches.groups.version, locale, matches.groups.path].join('/');
  if (newPath !== location.pathname) {
    console.log('Redirect to ' + newPath);
    location.pathname = newPath;
  }
  else {
    console.log('No need to redirect');
  }
}
else {
  console.error('Path does not match', location.pathname);
}

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
