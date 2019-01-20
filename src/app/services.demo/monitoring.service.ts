import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';

import { ArmType, ArmType2String, Sensor } from '../models/index';
import { MonitoringState } from '../models/index';
import { AlertService } from './alert.service';
import { EventService } from './event.service';
import { ZoneService } from './zone.service';

import { environment } from '../../environments/environment';

@Injectable()
export class MonitoringService {

  armState = ArmType.DISARMED;
  alert = false;
  datetime = new Date().toLocaleString();
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
    return of(this.armState).delay(environment.delay);
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
    return of({
        hw: this.datetime,
        network: this.datetime,
        system: this.datetime,
        timezone: this.timeZone,
    }).delay(environment.delay);
  }

  synchronizeClock() {
    return of(true);
  }

  changeClock(dateTime, timeZone) {
    this.datetime = dateTime;
    this.timeZone = timeZone;
    return of(true);
  }

  _onAlert(sensor: Sensor) {
    const zone = this.zoneService._getZone(sensor.zone_id);
    if (this.armState === ArmType.AWAY && zone.away_delay != null) {
      this.alertService._createAlert([sensor], ArmType.AWAY);
    } else if (this.armState === ArmType.STAY && zone.stay_delay != null) {
      this.alertService._createAlert([sensor], ArmType.STAY);
    } else if (this.armState !== ArmType.DISARMED) {
      console.error('Can\'t alert system!!!');
    }
  }
}

