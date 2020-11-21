
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';

import { throwError as observableThrowError,  Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ARM_TYPE, armType2String, Clocks, KeypadType, MONITORING_STATE, string2MonitoringState, string2ArmType } from '../../models';


@Injectable()
export class MonitoringService {

  constructor(
    private http: HttpClient
  ) { }

  isAlert(): Observable<boolean> {
    return this.http.get('/api/monitoring/isAlert').pipe(
      map(( response: HttpResponse<boolean> ) => response.body
      ), catchError(( err: HttpResponse<boolean> ) => {
        console.error( err );
        return observableThrowError( { description: 'Error Value Emitted' } );
      } ), );
  }

  getArmState(): Observable<ARM_TYPE> {
    return this.http.get<ARM_TYPE>('/api/monitoring/arm').pipe(
      map(( response: any ) => string2ArmType( response.type ) ));
  }

  arm( armtype: ARM_TYPE ) {
    const params = new HttpParams().set('type', armType2String(armtype));

    this.http.put('/api/monitoring/arm', null, { params } ).subscribe();
  }

  disarm() {
    return this.http.put('/api/monitoring/disarm', null).pipe(
      catchError(( err ) => {
        console.error( err );
        return observableThrowError( { description: 'Error Value Emitted' } );
      } ))
      .subscribe();
  }

  getMonitoringState(): Observable<MONITORING_STATE> {
    return this.http.get('/api/monitoring/state').pipe(
      map(( response: any ) => string2MonitoringState( response.state ) ));
  }

  getVersion(): Observable<string> {
    return this.http.get('/api/version', {responseType: 'text'});
  }

  getClock(): Observable<Clocks> {
    return this.http.get<Clocks>('/api/clock');
  }

  synchronizeClock() {
    return this.http.put('/api/clock/sync', null).pipe(
      catchError(( err ) => {
        console.error( err );
        return observableThrowError( { description: 'Error Value Emitted' } );
      } ));
  }

  changeClock(dateTime: string, timeZone: string) {
    const parameters: any = { };
    if (timeZone != null) {
      parameters.timezone = timeZone;
    }
    if (dateTime != null) {
      parameters.datetime = dateTime;
    }
    if (dateTime == null && timeZone == null) {
      return;
    }

    return this.http.put('/api/clock', parameters).pipe(
      catchError(( err ) => {
        console.error( err );
        return observableThrowError( { description: 'Error Value Emitted' } );
      } ));
  }

  getKeypadTypes(): Observable<KeypadType[]> {
    // get sensor types from api
    return this.http.get<KeypadType[]>('/api/keypadtypes');
  }
}
