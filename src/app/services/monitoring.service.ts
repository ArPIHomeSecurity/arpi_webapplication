import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

import { ArmType, ArmType2String, String2ArmType } from '../models/index';
import { MonitoringState, String2MonitoringState } from '../models/index';
import { AuthenticationService } from '../services/authentication.service';
import { environment } from '../../environments/environment';


@Injectable()
export class MonitoringService {

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) { }

  is_alert(): Observable<boolean> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    return this.http.get( '/api/monitoring/isAlert', { headers } )
      .map(( response: HttpResponse<boolean> ) => response.body
      ).catch(( err: HttpResponse<boolean> ) => {
        console.log( err );
        return Observable.throw( { description: 'Error Value Emitted' } );
      } );
  }

  getArmState(): Observable<ArmType> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    return this.http.get<ArmType>( '/api/monitoring/arm', { headers } )
      .map(( response ) => String2ArmType( response['type'] ) );
  }

  arm( armtype: ArmType ) {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    const params = new HttpParams().set('type', ArmType2String(armtype));

    console.log("ARm: ", armtype);
    console.log("Param: ", params);
    this.http.put( '/api/monitoring/arm', null, { headers, params } )
      .subscribe();
  }

  disarm() {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    return this.http.put( '/api/monitoring/disarm', null, { headers } )
      .catch(( err ) => {
        console.log( err );
        return Observable.throw( { description: 'Error Value Emitted' } );
      } )
      .subscribe();
  }

  getMonitoringState(): Observable<MonitoringState> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    return this.http.get( '/api/monitoring/state', { headers } )
      .map(( response ) => String2MonitoringState( response['state'] ) );
  }
}
