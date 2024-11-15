import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Preferences } from '@capacitor/preferences';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import * as moment from 'moment';
import { checkUrl } from '@app/utils';


/**
 * Load the domains + localhosts and check which one is available.
 * Set the base domain to the first available one.
 */
const setBackendUrl = async () => {
  const installations = JSON.parse(localStorage.getItem('installations'));
  const selectedInstallationId = localStorage.getItem('selectedInstallationId');
  const backendDomain = localStorage.getItem('backend.domain');

  if (installations && selectedInstallationId) {
    const installation = installations.find(i => i.id === selectedInstallationId);
    if (installation) {
      if (installation.primaryDomain) {
        const primaryAvailable = await checkUrl(`${installation.scheme}://${installation.primaryDomain}:${installation.primaryPort}/api/version`)
        if (primaryAvailable && backendDomain !== installation.primaryDomain) {
          console.log('Primary domain is available: ', installation.primaryDomain);
          localStorage.setItem('backend.scheme', installation.scheme);
          localStorage.setItem('backend.domain', installation.primaryDomain);
          localStorage.setItem('backend.port', installation.primaryPort);
          window.location.reload();
        }
        else if (backendDomain === installation.primaryDomain) {
          return;
        }
      }

      if (installation.secondaryDomain) {
        const secondaryAvailable = await checkUrl(`${installation.scheme}://${installation.secondaryDomain}:${installation.secondaryPort}/api/version`)
        if (secondaryAvailable && backendDomain !== installation.secondaryDomain) {
          console.log('Secondary domain is available: ', installation.secondaryDomain);
          localStorage.setItem('backend.scheme', installation.scheme);
          localStorage.setItem('backend.domain', installation.secondaryDomain);
          localStorage.setItem('backend.port', installation.secondaryPort);
          window.location.reload();
        }
        else if (backendDomain === installation.secondaryDomain) {
          return;
        }
      }
    }
  }

  // if (backendDomain !== '' &&) {
  //   console.log('No domain available, reset base domain');
  //   localStorage.setItem('backend.domain', '');
  //   window.location.reload();
  // }
}

setBackendUrl();

let locale = localStorage.getItem('localeId');
console.log('Selected language: ', locale);
if (locale === null) {
  locale = 'en';
}

moment.locale(locale);

console.log('Current location: ', location.pathname);
var localeRegex = new RegExp('^/([a-z]{2})/');
var matches = localeRegex.exec(location.pathname);

console.log('Current locale: ', matches === null ? 'en' : matches[1]);

if (
  (matches === null && locale === 'en') ||
  (matches !== null && locale === matches[1])
) {
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
  const newPath = location.pathname.replace(matches[1], 'en');
  console.log('Redirect to ' + newPath);
  location.pathname = newPath;
}

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
