import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { DEMO_CONFIGURATION } from '@app/demo/configuration';
import { Option } from '@app/models';
import { AUTHENTICATION_SERVICE } from '@app/tokens';
import { getSessionValue, setSessionValue } from '@app/utils';
import { environment } from '@environments/environment';
import { AuthenticationService } from './authentication.service';

@Injectable()
export class ConfigurationService {
  configuration: Option[];

  constructor(@Inject(AUTHENTICATION_SERVICE) private authService: AuthenticationService) {
    this.configuration = getSessionValue('ConfigurationService.configuration', DEMO_CONFIGURATION);
  }

  getOption(option: string, section: string): Observable<Option> {
    return of(this.configuration.find(o => o.option === option && o.section === section)).pipe(
      delay(environment.delay),
      map(_ => {
        this.authService.updateUserToken('user.session');
        return _;
      })
    );
  }

  setOption(option: string, section: string, value: any): Observable<boolean> {
    const tmpOption = this.configuration.find(o => o.option === option && o.section === section);
    if (tmpOption != null) {
      tmpOption.value = value;
    } else {
      this.configuration.push({ option, section, value });
    }

    setSessionValue('ConfigurationService.configuration', this.configuration);
    return of(true).pipe(
      delay(environment.delay),
      map(_ => {
        this.authService.updateUserToken('user.session');
        return _;
      })
    );
  }

  sendTestEmail() {}

  sendTestSMS() {}

  testSyren(duration?: number) {}

  getPublicAccess(): Observable<boolean> {
    return of(true);
  }
}
