import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { ArmType, Alert } from '../models/index';
import { AuthenticationService } from '../services/authentication.service';
import { environment } from '../../environments/environment';

@Injectable()
export class AlertService {

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) { }

  getAlerts(): Observable<Alert[]> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // get sensors from api
    return this.http.get<Alert[]>( '/api/alerts', { headers } );
  }


  getAlert(): Observable<Alert> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // get sensors from api
    return this.http.get<Alert>( '/api/alert', { headers } );
  }
}
