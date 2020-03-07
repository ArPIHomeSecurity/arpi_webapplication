
import {throwError as observableThrowError,  Observable } from 'rxjs';

import {catchError, map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';

import { ArmType, ArmType2String, KeypadType, MonitoringState, String2MonitoringState, String2ArmType } from '../models';
import { AuthenticationService } from '../services/authentication.service';


@Injectable()
export class MonitoringService {

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) { }

  is_alert(): Observable<boolean> {
    return this.http.get('/api/monitoring/isAlert').pipe(
      map(( response: HttpResponse<boolean> ) => response.body
      ), catchError(( err: HttpResponse<boolean> ) => {
        console.log( err );
        return observableThrowError( { description: 'Error Value Emitted' } );
      } ), );
  }

  getArmState(): Observable<ArmType> {
    return this.http.get<ArmType>('/api/monitoring/arm').pipe(
      map(( response ) => String2ArmType( response['type'] ) ));
  }

  arm( armtype: ArmType ) {
    const params = new HttpParams().set( 'type', ArmType2String( armtype ) );

    this.http.put('/api/monitoring/arm', null, { params } ).subscribe();
  }

  disarm() {
    return this.http.put('/api/monitoring/disarm', null).pipe(
      catchError(( err ) => {
        console.log( err );
        return observableThrowError( { description: 'Error Value Emitted' } );
      } ))
      .subscribe();
  }

  getMonitoringState(): Observable<MonitoringState> {
    return this.http.get('/api/monitoring/state').pipe(
      map(( response ) => String2MonitoringState( response['state'] ) ));
  }

  getVersion(): Observable<string> {
    return this.http.get('/api/version', {responseType: 'text'});
  }

  getClock(): Observable<Object> {
    return this.http.get<Object>('/api/clock');
  }

  synchronizeClock() {
    return this.http.put('/api/clock/sync', null).pipe(
      catchError(( err ) => {
        console.log( err );
        return observableThrowError( { description: 'Error Value Emitted' } );
      } ));
  }

  changeClock(dateTime, timeZone) {
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

    return this.http.put('/api/clock', parameters).pipe(
      catchError(( err ) => {
        console.log( err );
        return observableThrowError( { description: 'Error Value Emitted' } );
      } ));
  }

  getKeypadTypes(): Observable<KeypadType[]> {
    // get sensor types from api
    return this.http.get<KeypadType[]>('/api/keypadtypes');
  }
}
