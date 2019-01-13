import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';

import {throwError as observableThrowError,  Observable, of } from 'rxjs';

import { Alert, ArmType, ArmType2String, String2ArmType, Sensor } from '../models/index';
import { MonitoringState, String2MonitoringState } from '../models/index';
import { environment } from '../../environments/environment.demo';
import { AlertService } from './alert.service';
import { EventService } from './event.service';
import { ZoneService } from './zone.service';


@Injectable()
export class MonitoringService {

  armState = ArmType.DISARMED;
  alert = false;

  constructor(
    private alertService: AlertService,
    private eventService: EventService,
    private zoneService: ZoneService
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
    this.alertService._stopAlert();
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
    return of(null);
  }

  synchronizeClock() {
    return of(true);
  }

  changeClock(dateTime, timeZone) {
    return of(true);
  }

  _onAlert(sensor: Sensor) {
    const zone = this.zoneService._getZone(sensor.zone_id);
    if (this.armState === ArmType.AWAY && zone.away_delay != null) {
      this.alertService._createAlert([sensor], ArmType.AWAY);
    } else if (this.armState === ArmType.STAY && zone.stay_delay != null) {
      this.alertService._createAlert([sensor], ArmType.STAY);
    } else {
      console.error('Can\'t alert system!!!');
    }
  }
}

