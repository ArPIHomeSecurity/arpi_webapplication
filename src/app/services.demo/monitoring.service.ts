import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';

import {throwError as observableThrowError,  Observable, of } from 'rxjs';

import { ArmType, ArmType2String, String2ArmType } from '../models/index';
import { MonitoringState, String2MonitoringState } from '../models/index';
import { AuthenticationService } from './authentication.service';
import { environment } from '../../environments/environment.demo';


@Injectable()
export class MonitoringService {

  armState = ArmType.DISARMED;
  alert = false;

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) { }

  is_alert(): Observable<boolean> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    return of(this.alert);
  }

  getArmState(): Observable<ArmType> {
    return of(this.armState);
  }

  arm( armtype: ArmType ) {
    return;
  }

  disarm() {
    return;
  }

  getMonitoringState(): Observable<MonitoringState> {
    return of(MonitoringState.READY).delay(environment.delay);
  }

  getVersion(): Observable<string> {
    return of('Version:DEMO-0.1');
  }

  getClock(): Observable<Object> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    return this.http.get<Object>( '/api/clock', { headers } );
  }

  synchronizeClock() {
    return of(true);
  }

  changeClock(dateTime, timeZone) {
    return of(true);
  }
}

