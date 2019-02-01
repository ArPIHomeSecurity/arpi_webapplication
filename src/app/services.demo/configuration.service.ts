import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { Option } from '../models/index';
import { AuthenticationService } from '../services/authentication.service';

import { environment, CONFIGURATION } from '../../environments/environment';
import { getSessionValue, setSessionValue } from '../utils';


@Injectable()
export class ConfigurationService {

  configuration: Option[];

  constructor(
    private authService: AuthenticationService
  ) {
    this.configuration = getSessionValue('ConfigurationService.configuration', CONFIGURATION);
  }


  getOption( option: string, section: string ): Observable<Option> {
    return of(this.configuration.find(o => o.option === option && o.section === section)).delay(environment.delay);
  }


  setOption( option: string, section: string, value: any ): Observable<boolean> {
    const tmpOption = this.configuration.find(o => o.option === option && o.section === section);
    if (tmpOption != null) {
      tmpOption.value = value;
    } else {
      this.configuration.push({option: option, section: section, value: value});
    }

    setSessionValue('ConfigurationService.configuration', this.configuration);
    return of(true).delay(environment.delay);
  }
}