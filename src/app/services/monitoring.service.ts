
import {throwError as observableThrowError,  Observable } from 'rxjs';

import {catchError, map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';

import { ArmType, ArmType2String, MonitoringState, String2MonitoringState, String2ArmType } from '../models';
import { AuthenticationService } from '../services';


@Injectable()
export class MonitoringService {

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) { }

  is_alert(): Observable<boolean> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    return this.http.get( '/api/monitoring/isAlert', { headers } ).pipe(
      map(( response: HttpResponse<boolean> ) => response.body
      ), catchError(( err: HttpResponse<boolean> ) => {
        console.log( err );
        return observableThrowError( { description: 'Error Value Emitted' } );
      } ), );
  }

  getArmState(): Observable<ArmType> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    return this.http.get<ArmType>( '/api/monitoring/arm', { headers } ).pipe(
      map(( response ) => String2ArmType( response['type'] ) ));
  }

  arm( armtype: ArmType ) {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );
    const params = new HttpParams().set( 'type', ArmType2String( armtype ) );

    this.http.put( '/api/monitoring/arm', null, { headers, params } )
      .subscribe();
  }

  disarm() {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    return this.http.put( '/api/monitoring/disarm', null, { headers } ).pipe(
      catchError(( err ) => {
        console.log( err );
        return observableThrowError( { description: 'Error Value Emitted' } );
      } ))
      .subscribe();
  }

  getMonitoringState(): Observable<MonitoringState> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    return this.http.get( '/api/monitoring/state', { headers } ).pipe(
      map(( response ) => String2MonitoringState( response['state'] ) ));
  }

  getVersion(): Observable<string> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    return this.http.get( '/api/version', { headers, responseType: 'text' } );
  }

  getClock(): Observable<Object> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    return this.http.get<Object>( '/api/clock', { headers } );
  }

  synchronizeClock() {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    return this.http.put( '/api/clock/sync', null, { headers } ).pipe(
      catchError(( err ) => {
        console.log( err );
        return observableThrowError( { description: 'Error Value Emitted' } );
      } ));
  }

  changeClock(dateTime, timeZone) {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    const parameters = { };
    if (timeZone != null) {
      parameters['timezone'] = timeZone;
    }
    if (dateTime != null) {
      parameters['datetime'] = dateTime;
    }
    if (dateTime == null && timeZone == null) {
      return;
    }

    return this.http.put( '/api/clock', parameters, { headers } ).pipe(
      catchError(( err ) => {
        console.log( err );
        return observableThrowError( { description: 'Error Value Emitted' } );
      } ));
  }
}
