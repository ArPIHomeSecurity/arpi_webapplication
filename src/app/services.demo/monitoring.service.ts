import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { ArmType, ArmType2String, Sensor, MonitoringState2String } from '../models';
import { MonitoringState } from '../models';
import { AlertService } from './alert.service';
import { EventService } from './event.service';
import { ZoneService } from './zone.service';

import { environment } from '../../environments/environment';
import { getSessionValue, setSessionValue } from '../utils';

@Injectable()
export class MonitoringService {

  monitoringState: MonitoringState;
  armState: ArmType;
  alert: boolean;
  datetime: string;
  timeZone: string;

  constructor(
    private alertService: AlertService,
    private eventService: EventService,
    private zoneService: ZoneService
  ) {
    this.monitoringState = getSessionValue('MonitoringService.monitoringState', MonitoringState.STARTUP)
    this.armState = getSessionValue('MonitoringService.armState', ArmType.DISARMED);
    this.alert = getSessionValue('MonitoringService.alert', false);
    this.datetime = getSessionValue('MonitoringService.datetime', new Date().toLocaleString());
    this.timeZone = getSessionValue('MonitoringService.timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    if (this.monitoringState === MonitoringState.STARTUP) {
      setTimeout(() => {
        this.monitoringState = MonitoringState.UPDATING_CONFIG;
        setSessionValue('MonitoringService.monitoringState', this.monitoringState);
        this.eventService._updateMonitoringState(MonitoringState2String(this.monitoringState));
        setTimeout(() => {
          this.monitoringState = MonitoringState.READY;
          setSessionValue('MonitoringService.monitoringState', this.monitoringState);
          this.eventService._updateMonitoringState(MonitoringState2String(this.monitoringState));
        }, 3000);
      }, 2000);
    }
  }

  is_alert(): Observable<boolean> {
    return of(this.alert).pipe(delay(environment.delay));
  }

  getArmState(): Observable<ArmType> {
    return of(this.armState).pipe(delay(environment.delay));
  }

  arm(armtype: ArmType) {
    this.armState = armtype;
    this.monitoringState = MonitoringState.ARMED;
    setSessionValue('MonitoringService.armState', this.armState);
    setSessionValue('MonitoringService.monitoringState', this.monitoringState);
    this.eventService._updateArmState(ArmType2String(armtype));
    this.eventService._updateMonitoringState(MonitoringState2String(this.monitoringState));
    return;
  }

  disarm() {
    this.armState = ArmType.DISARMED;
    this.monitoringState = MonitoringState.READY;
    setSessionValue('MonitoringService.armState', this.armState);
    setSessionValue('MonitoringService.monitoringState', this.monitoringState);
    this.alertService._stopAlert();
    this.eventService._updateArmState(ArmType2String(this.armState));
    this.eventService._updateMonitoringState(MonitoringState2String(this.monitoringState));
    return;
  }

  getMonitoringState(): Observable<MonitoringState> {
    return of(this.monitoringState).pipe(delay(environment.delay));
  }

  getVersion(): Observable<string> {
    return of('Version:DEMO-0.3');
  }

  getClock(): Observable<Object> {
    return of({
        hw: this.datetime,
        network: this.datetime,
        system: this.datetime,
        timezone: this.timeZone,
    }).pipe(delay(environment.delay));
  }

  synchronizeClock() {
    return of(true);
  }

  changeClock(dateTime, timeZone) {
    this.datetime = dateTime;
    this.timeZone = timeZone;
    setSessionValue('MonitoringService.datetime', this.datetime);
    setSessionValue('MonitoringService.timeZone', this.timeZone);
    return of(true);
  }

  _onAlert(sensor: Sensor) {
    const zone = this.zoneService._getZone(sensor.zone_id);
    if (this.armState === ArmType.AWAY && zone.away_delay != null && sensor.enabled) {
      setTimeout(() => {
        if (this.armState !== ArmType.DISARMED) {
          this.alertService._createAlert([sensor], ArmType.AWAY);
        }
      }, 1000 * zone.away_delay);
    } else if (this.armState === ArmType.STAY && zone.stay_delay != null && sensor.enabled) {
      setTimeout(() => {
        if (this.armState !== ArmType.DISARMED) {
          this.alertService._createAlert([sensor], ArmType.STAY);
        }
      }, 1000 * zone.stay_delay);
    } else if (this.armState === ArmType.DISARMED && zone.disarmed_delay != null && sensor.enabled) {
      setTimeout(() => {
        this.alertService._createAlert([sensor], ArmType.DISARMED);
      }, 1000 * zone.disarmed_delay);
    } else if (this.armState !== ArmType.DISARMED) {
      console.error('Can\'t alert system!!!');
    }
  }

  _resetReferences() {
    this.monitoringState = MonitoringState.UPDATING_CONFIG;
    setSessionValue('MonitoringService.monitoringState', this.monitoringState);
    this.eventService._updateMonitoringState(MonitoringState2String(this.monitoringState));
    setTimeout(() => {
      this.monitoringState = MonitoringState.READY;
      setSessionValue('MonitoringService.monitoringState', this.monitoringState);
      this.eventService._updateMonitoringState(MonitoringState2String(this.monitoringState));
    }, 3000);
  }
}
