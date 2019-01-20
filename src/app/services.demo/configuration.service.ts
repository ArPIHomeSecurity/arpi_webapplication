import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { Option } from '../models/index';
import { AuthenticationService } from '../services/authentication.service';

import { environment, CONFIGURATION } from '../../environments/environment';


@Injectable()
export class ConfigurationService {

  configuration: Option[] = CONFIGURATION;

  constructor(
    private authService: AuthenticationService
  ) { }


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

    return of(true).delay(environment.delay);
  }
}
