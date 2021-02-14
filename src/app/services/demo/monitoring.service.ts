import { Inject, Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { AlertService } from './alert.service';
import { AuthenticationService } from './authentication.service';
import { EventService } from './event.service';
import { ZoneService } from './zone.service';
import { ALERT_TYPE, ARM_TYPE, armType2String, Clocks, Sensor, MONITORING_STATE, monitoringState2String, POWER_STATE } from '../../models';

import { environment } from '../../../environments/environment';
import { getSessionValue, setSessionValue } from '../../utils';

@Injectable()
export class MonitoringService {

  monitoringState: MONITORING_STATE;
  armState: ARM_TYPE;
  alert: boolean;
  datetime: string;
  timeZone: string;

  constructor(
    @Inject('AlertService') private alertService: AlertService,
    @Inject('AuthenticationService') private authService: AuthenticationService,
    @Inject('EventService') private eventService: EventService,
    @Inject('ZoneService') private zoneService: ZoneService
  ) {
    this.monitoringState = getSessionValue('MonitoringService.monitoringState', MONITORING_STATE.STARTUP);
    this.armState = getSessionValue('MonitoringService.armState', ARM_TYPE.DISARMED);
    this.alert = getSessionValue('MonitoringService.alert', false);
    this.datetime = getSessionValue('MonitoringService.datetime', new Date().toLocaleString());
    this.timeZone = getSessionValue('MonitoringService.timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    if (this.monitoringState !== MONITORING_STATE.READY &&
        this.monitoringState !== MONITORING_STATE.ARMED &&
        this.monitoringState !== MONITORING_STATE.SABOTAGE) {
      this.monitoringState = MONITORING_STATE.STARTUP;
    }

    if (this.monitoringState === MONITORING_STATE.STARTUP) {
      setTimeout(() => {
        this.monitoringState = MONITORING_STATE.UPDATING_CONFIG;
        setSessionValue('MonitoringService.monitoringState', this.monitoringState);
        this.eventService.updateMonitoringState(monitoringState2String(this.monitoringState));
        setTimeout(() => {
          this.monitoringState = MONITORING_STATE.READY;
          setSessionValue('MonitoringService.monitoringState', this.monitoringState);
          this.eventService.updateMonitoringState(monitoringState2String(this.monitoringState));
        }, 3000);
      }, 2000);
    }
  }

  isAlert(): Observable<boolean> {
    return of(this.alert)
      .pipe(
        delay(environment.delay),
        map(_ => {
          this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }

  getArmState(): Observable<ARM_TYPE> {
    return of(this.armState)
      .pipe(
        delay(environment.delay),
        map(_ => {
          this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }

  arm(armtype: ARM_TYPE) {
    this.armState = armtype;
    this.monitoringState = MONITORING_STATE.ARMED;
    setSessionValue('MonitoringService.armState', this.armState);
    setSessionValue('MonitoringService.monitoringState', this.monitoringState);
    this.eventService.updateArmState(armType2String(armtype));
    this.eventService.updateMonitoringState(monitoringState2String(this.monitoringState));
    this.authService.updateUserToken('user.token');
    return;
  }

  disarm() {
    this.armState = ARM_TYPE.DISARMED;
    this.monitoringState = MONITORING_STATE.READY;
    setSessionValue('MonitoringService.armState', this.armState);
    setSessionValue('MonitoringService.monitoringState', this.monitoringState);
    this.alertService.stopAlert();
    this.eventService.updateArmState(armType2String(this.armState));
    this.eventService.updateMonitoringState(monitoringState2String(this.monitoringState));
    this.authService.updateUserToken('user.token');
    return;
  }

  getMonitoringState(): Observable<MONITORING_STATE> {
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

  getPowerState(): Observable<POWER_STATE> {
    return of(POWER_STATE.NETWORK)
      .pipe(
        delay(environment.delay)
      );
  }

  onAlert(sensor: Sensor) {
    const zone = this.zoneService.getZoneDirectly(sensor.zoneId);
    if (this.armState === ARM_TYPE.AWAY && zone.awayDelay != null && sensor.enabled) {
      setTimeout(() => {
        if (this.armState !== ARM_TYPE.DISARMED) {
          if (sensor.alert) {
            this.alertService.createAlert([sensor], ALERT_TYPE.AWAY);
          }
        }
      }, 1000 * zone.awayDelay);
    } else if (this.armState === ARM_TYPE.STAY && zone.stayDelay != null && sensor.enabled) {
      setTimeout(() => {
        if (this.armState !== ARM_TYPE.DISARMED) {
          if (sensor.alert) {
            this.alertService.createAlert([sensor], ALERT_TYPE.STAY);
          }
        }
      }, 1000 * zone.stayDelay);
    } else if (this.armState === ARM_TYPE.DISARMED && zone.disarmedDelay != null && sensor.enabled) {
      setTimeout(() => {
        this.alertService.createAlert([sensor], ALERT_TYPE.SABOTAGE);
      }, 1000 * zone.disarmedDelay);
    } else if (this.armState !== ARM_TYPE.DISARMED) {
      console.error('Can\'t alert system!!!');
    }
  }

  resetReferences() {
    this.monitoringState = MONITORING_STATE.UPDATING_CONFIG;
    setSessionValue('MonitoringService.monitoringState', this.monitoringState);
    this.eventService.updateMonitoringState(monitoringState2String(this.monitoringState));
    setTimeout(() => {
      this.monitoringState = MONITORING_STATE.READY;
      setSessionValue('MonitoringService.monitoringState', this.monitoringState);
      this.eventService.updateMonitoringState(monitoringState2String(this.monitoringState));
    }, 3000);
  }
}
