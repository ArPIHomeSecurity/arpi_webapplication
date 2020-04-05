import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { AuthenticationService } from './authentication.service';
import { Option } from '../models';

import { environment } from '../../environments/environment';
import { getSessionValue, setSessionValue } from '../utils';


@Injectable()
export class ConfigurationService {

  configuration: Option[];

  constructor(
    private authService: AuthenticationService
  ) {
    this.configuration = getSessionValue('ConfigurationService.configuration', []);
  }


  getOption( option: string, section: string ): Observable<Option> {
    return of(this.configuration.find(o => o.option === option && o.section === section))
      .pipe(
        delay(environment.delay),
        map(_ => {
          this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }


  setOption( option: string, section: string, value: any ): Observable<boolean> {
    const tmpOption = this.configuration.find(o => o.option === option && o.section === section);
    value = JSON.stringify(value);
    if (tmpOption != null) {
      tmpOption.value = value;
    } else {
      this.configuration.push({option: option, section: section, value: value});
    }

    setSessionValue('ConfigurationService.configuration', this.configuration);
    return of(true)
      .pipe(
        delay(environment.delay),
        map(_ => {
          this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }
}
