import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Option } from '../models/index';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class ConfigurationService {
  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) { }


  getOption( option: string, section: string ): Observable<Option> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // get configuration option from api
    return this.http.get<Option>( '/api/config/' + option + '/' + section, { headers } );
  }


  setOption( option: string, section: string, value: any ): Observable<boolean> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // get configuration option from api
    return this.http.put( '/api/config/' + option + '/' + section, value, { headers } );
  }
}
