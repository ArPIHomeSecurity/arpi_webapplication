import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { AlertService } from './alert.service';
import { AuthenticationService } from './authentication.service';
import { EventService } from './event.service';
import { ZoneService } from './zone.service';
import { AlertType, ArmType, ArmType2String, Clocks, Sensor, MonitoringState, MonitoringState2String } from '../models';

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
    private authService: AuthenticationService,
    private eventService: EventService,
    private zoneService: ZoneService
  ) {
    this.monitoringState = getSessionValue('MonitoringService.monitoringState', MonitoringState.STARTUP)
    this.armState = getSessionValue('MonitoringService.armState', ArmType.DISARMED);
    this.alert = getSessionValue('MonitoringService.alert', false);
    this.datetime = getSessionValue('MonitoringService.datetime', new Date().toLocaleString());
    this.timeZone = getSessionValue('MonitoringService.timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    if (this.monitoringState !== MonitoringState.READY &&
        this.monitoringState !== MonitoringState.ARMED &&
        this.monitoringState !== MonitoringState.SABOTAGE) {
      this.monitoringState = MonitoringState.STARTUP;
    }

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
    return of(this.alert)
      .pipe(
        delay(environment.delay),
        map(_ => {
          this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }

  getArmState(): Observable<ArmType> {
    return of(this.armState)
      .pipe(
        delay(environment.delay),
        map(_ => {
          this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }

  arm(armtype: ArmType) {
    this.armState = armtype;
    this.monitoringState = MonitoringState.ARMED;
    setSessionValue('MonitoringService.armState', this.armState);
    setSessionValue('MonitoringService.monitoringState', this.monitoringState);
    this.eventService._updateArmState(ArmType2String(armtype));
    this.eventService._updateMonitoringState(MonitoringState2String(this.monitoringState));
    this.authService.updateUserToken('user.token');
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
    this.authService.updateUserToken('user.token');
    return;
  }

  getMonitoringState(): Observable<MonitoringState> {
    return of(this.monitoringState)
      .pipe(
        delay(environment.delay),
        map(_ => {
          this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }

  getVersion(): Observable<string> {
    return of('Version:DEMO-0.5');
  }

  getClock(): Observable<Clocks> {
    return of({
        hw: this.datetime,
        network: this.datetime,
        system: this.datetime,
        timezone: this.timeZone,
    })
      .pipe(
        delay(environment.delay),
        map(_ => {
          this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }

  synchronizeClock() {
    return of(true)
      .pipe(
        delay(environment.delay),
        map(_ => {
          this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }

  changeClock(dateTime: string, timeZone: string) {
    this.datetime = dateTime;
    this.timeZone = timeZone;
    setSessionValue('MonitoringService.datetime', this.datetime);
    setSessionValue('MonitoringService.timeZone', this.timeZone);
    return of(true)
      .pipe(
        delay(environment.delay),
        map(_ => {
          this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }

  _onAlert(sensor: Sensor) {
    const zone = this.zoneService._getZone(sensor.zoneId);
    if (this.armState === ArmType.AWAY && zone.awayDelay != null && sensor.enabled) {
      setTimeout(() => {
        if (this.armState !== ArmType.DISARMED) {
          if (sensor.alert) {
            this.alertService._createAlert([sensor], AlertType.AWAY);
          }
        }
      }, 1000 * zone.awayDelay);
    } else if (this.armState === ArmType.STAY && zone.stayDelay != null && sensor.enabled) {
      setTimeout(() => {
        if (this.armState !== ArmType.DISARMED) {
          if (sensor.alert) {
            this.alertService._createAlert([sensor], AlertType.STAY);
          }
        }
      }, 1000 * zone.stayDelay);
    } else if (this.armState === ArmType.DISARMED && zone.disarmedDelay != null && sensor.enabled) {
      setTimeout(() => {
        this.alertService._createAlert([sensor], AlertType.SABOTAGE);
      }, 1000 * zone.disarmedDelay);
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
