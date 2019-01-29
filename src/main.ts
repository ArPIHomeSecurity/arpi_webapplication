import { enableProdMode, TRANSLATIONS, TRANSLATIONS_FORMAT, LOCALE_ID } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';



declare const require;

let locale;
if (localStorage.getItem('localeId') !== null) {
  locale = localStorage.getItem('localeId');
}
else {
  locale = 'en';
}

console.log("Selected language: ", locale);
console.log("Current location: ", location.pathname);

if (environment.production || window.location.hostname === 'demo.arpi-security.info') {
  enableProdMode();

  if (location.pathname.startsWith("/" + locale)) {
    console.log("Correct locale, no need to redirect!");
  }
  else if (locale != 'en') {
    console.log("Other locale is selected => redirect", locale);
    location.href = "/" + locale + location.pathname;
  }
}


const translation_file = require(`raw-loader!./locales/messages.${locale}.xlf`);

platformBrowserDynamic().bootstrapModule(AppModule, { providers: [
  { provide: TRANSLATIONS, useValue: translation_file },
  { provide: TRANSLATIONS_FORMAT, useValue: 'xlf' },
  { provide: LOCALE_ID, useValue: locale }
]});