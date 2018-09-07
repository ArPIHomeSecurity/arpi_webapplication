import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { Option } from '../models/index';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class ConfigurationService {
  constructor(
    private http: Http,
    private authService: AuthenticationService
  ) { }


  getOption(option: string, section: string): Observable<Option> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

    // get configuration option from api
    return this.http.get('/api/config/' + option + '/' + section, options)
      .map((response: Response) => response.json());
  }

  
  setOption(option: string, section: string, value: any) {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

//    console.log("Option", option);
//    console.log("Section", section);
//    console.log("Value", value);

    // get configuration option from api
    return this.http.put('/api/config/' + option + '/' + section, value, options)
      .map((response: Response) => response.json()).subscribe();
  }
}
