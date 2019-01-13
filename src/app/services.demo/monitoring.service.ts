import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';

import {throwError as observableThrowError,  Observable, of } from 'rxjs';

import { ArmType, ArmType2String, String2ArmType } from '../models/index';
import { MonitoringState, String2MonitoringState } from '../models/index';
import { AuthenticationService } from './authentication.service';
import { environment } from '../../environments/environment.demo';
import { EventService } from './event.service';


@Injectable()
export class MonitoringService {

  armState = ArmType.DISARMED;
  alert = false;

  constructor(
    private http: HttpClient,
    private eventService: EventService
  ) {

  }

  is_alert(): Observable<boolean> {
    return of(this.alert);
  }

  getArmState(): Observable<ArmType> {
    return of(this.armState);
  }

  arm( armtype: ArmType ) {
    this.armState = armtype;
    this.eventService._updateArmState(ArmType2String(armtype));
    return;
  }

  disarm() {
    this.armState = ArmType.DISARMED;
    this.eventService._updateArmState(ArmType2String(this.armState));
    return;
  }

  getMonitoringState(): Observable<MonitoringState> {
    return of(MonitoringState.READY).delay(environment.delay);
  }

  getVersion(): Observable<string> {
    return of('Version:DEMO-0.1');
  }

  getClock(): Observable<Object> {
    return this.http.get<Object>( '/api/clock', { } );
  }

  synchronizeClock() {
    return of(true);
  }

  changeClock(dateTime, timeZone) {
    return of(true);
  }
}

