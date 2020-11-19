import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Option } from '../../models';


@Injectable()
export class ConfigurationService implements ConfigurationService {
  constructor(
    private http: HttpClient
  ) { }


  getOption( option: string, section: string ): Observable<Option> {
    // get configuration option from api
    return this.http.get<Option>('/api/config/' + option + '/' + section);
  }


  setOption( option: string, section: string, value: any ): Observable<any> {
    // get configuration option from api
    return this.http.put('/api/config/' + option + '/' + section, value);
  }
}
