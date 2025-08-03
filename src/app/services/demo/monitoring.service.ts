import { Inject, Injectable, Injector } from '@angular/core';

import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import {
  ALERT_TYPE,
  ARM_TYPE,
  armType2String,
  Clocks,
  Sensor,
  MONITORING_STATE,
  monitoringState2String,
  POWER_STATE
} from '@app/models';
import { environment } from '@environments/environment';
import { getSessionValue, setSessionValue } from '@app/utils';
import { AUTHENTICATION_SERVICE } from '@app/tokens';
import { AlertService } from './alert.service';
import { AreaService } from './area.service';
import { ArmService } from './arm.service';
import { AuthenticationService } from './authentication.service';
import { EventService } from './event.service';
import { ZoneService } from './zone.service';

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
  delayArm = false;
  monitoringState: MONITORING_STATE;
  armState: ARM_TYPE;
  alert: boolean;
  datetime: string;
  timeZone: string;

  constructor(
    @Inject('AlertService') private alertService: AlertService,
    @Inject(AUTHENTICATION_SERVICE) private authService: AuthenticationService,
    @Inject('EventService') private eventService: EventService,
    @Inject('ZoneService') private zoneService: ZoneService,

    // resolving circular dependency with AreaService, ArmService
    private injector: Injector
  ) {
    this.monitoringState = getSessionValue('MonitoringService.monitoringState', MONITORING_STATE.STARTUP);
    this.armState = getSessionValue('MonitoringService.armState', ARM_TYPE.DISARMED);
    this.alert = getSessionValue('MonitoringService.alert', false);
    this.datetime = getSessionValue(
      'MonitoringService.datetime',
      new Date().toISOString().split('.')[0].replace('T', ' ')
    );
    this.timeZone = getSessionValue('MonitoringService.timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    if (
      this.monitoringState !== MONITORING_STATE.READY &&
      this.monitoringState !== MONITORING_STATE.ARM_DELAY &&
      this.monitoringState !== MONITORING_STATE.ALERT_DELAY &&
      this.monitoringState !== MONITORING_STATE.ARMED &&
      this.monitoringState !== MONITORING_STATE.SABOTAGE
    ) {
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
    return of(this.alert).pipe(
      delay(environment.delay),
      map(_ => {
        this.authService.updateUserToken('user.session');
        return _;
      })
    );
  }

  getArmState(): Observable<ARM_TYPE> {
    return of(this.armState).pipe(
      delay(environment.delay),
      map(_ => {
        this.authService.updateUserToken('user.session');
        return _;
      })
    );
  }

  arm(armType: ARM_TYPE): Observable<Object> {
    let delay = 0;
    if (armType === ARM_TYPE.AWAY) {
      delay = Math.max(...this.zoneService.zones.map(z => z.awayArmDelay));
    } else if (armType === ARM_TYPE.STAY) {
      delay = Math.max(...this.zoneService.zones.map(z => z.stayArmDelay));
    }

    if (delay > 0) {
      this.setArm(armType, MONITORING_STATE.ARM_DELAY);
      this.delayArm = true;

      setTimeout(() => {
        if (this.delayArm) {
          this.setArm(armType, MONITORING_STATE.ARMED);
          this.delayArm = false;
        }
      }, 1000 * delay);
    } else {
      this.setArm(armType, MONITORING_STATE.ARMED);
    }

    return of(true);
  }

  setArm(armType: ARM_TYPE, monitoringState: MONITORING_STATE, updateAreas = true) {
    if (this.monitoringState === MONITORING_STATE.ARMED && this.armState !== armType) {
      armType = ARM_TYPE.MIXED;
    }

    this.armState = armType;
    this.monitoringState = monitoringState;
    if (updateAreas) {
      const areaService = this.injector.get(AreaService);
      areaService.updateAreaStates(armType);
    }
    setSessionValue('MonitoringService.armState', this.armState);
    setSessionValue('MonitoringService.monitoringState', this.monitoringState);
    this.eventService.updateArmState(armType2String(armType));
    this.eventService.updateMonitoringState(monitoringState2String(this.monitoringState));
    this.authService.updateUserToken('user.token');

    const armService = this.injector.get(ArmService);
    armService.startArm(armType, this.authService.getUser()?.id);
  }

  disarm(updateAreas = true): Observable<Object> {
    this.delayArm = false;
    this.armState = ARM_TYPE.DISARMED;
    this.monitoringState = MONITORING_STATE.READY;
    if (updateAreas) {
      const areaService = this.injector.get(AreaService);
      areaService.updateAreaStates(ARM_TYPE.DISARMED);
    }
    setSessionValue('MonitoringService.armState', this.armState);
    setSessionValue('MonitoringService.monitoringState', this.monitoringState);
    this.alertService.stopAlert();
    this.eventService.updateArmState(armType2String(this.armState));
    this.eventService.updateMonitoringState(monitoringState2String(this.monitoringState));
    this.authService.updateUserToken('user.token');

    const armService = this.injector.get(ArmService);
    armService.stopArm(this.authService.getUser()?.id);
    return of(true);
  }

  getMonitoringState(): Observable<MONITORING_STATE> {
    return of(this.monitoringState).pipe(
      delay(environment.delay),
      map(_ => {
        this.authService.updateUserToken('user.session');
        return _;
      })
    );
  }

  getVersion(): Observable<string> {
    return of('DEMO-0.15');
  }

  getClock(): Observable<Clocks> {
    return of({
      hw: this.datetime,
      network: this.datetime,
      system: this.datetime,
      timezone: this.timeZone
    }).pipe(
      delay(environment.delay),
      map(_ => {
        this.authService.updateUserToken('user.session');
        return _;
      })
    );
  }

  synchronizeClock() {
    return of(true).pipe(
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
    return of(true).pipe(
      delay(environment.delay),
      map(_ => {
        this.authService.updateUserToken('user.session');
        return _;
      })
    );
  }

  getPowerState(): Observable<POWER_STATE> {
    return of(POWER_STATE.NETWORK).pipe(delay(environment.delay));
  }

  startAlert(sensor: Sensor) {
    // do not alert when we are in delayed arm state
    if (this.delayArm && this.armState !== ARM_TYPE.DISARMED) {
      return;
    }

    const areaService = this.injector.get(AreaService);
    const area = areaService.getAreaDirectly(sensor.areaId);
    const zone = this.zoneService.getZoneDirectly(sensor.zoneId);
    if (area.armState === ARM_TYPE.AWAY && zone.awayAlertDelay != null && sensor.enabled) {
      this.monitoringState = MONITORING_STATE.ALERT_DELAY;
      this.eventService.updateMonitoringState(monitoringState2String(this.monitoringState));
      setTimeout(() => {
        this.monitoringState = MONITORING_STATE.ALERT;
        this.eventService.updateMonitoringState(monitoringState2String(this.monitoringState));
        if (area.armState !== ARM_TYPE.DISARMED) {
          if (sensor.alert) {
            this.alertService.createAlert([sensor], ALERT_TYPE.AWAY);
          }
        }
      }, 1000 * zone.awayAlertDelay);
    } else if (area.armState === ARM_TYPE.STAY && zone.stayAlertDelay != null && sensor.enabled) {
      this.monitoringState = MONITORING_STATE.ALERT_DELAY;
      this.eventService.updateMonitoringState(monitoringState2String(this.monitoringState));
      setTimeout(() => {
        this.monitoringState = MONITORING_STATE.ALERT;
        this.eventService.updateMonitoringState(monitoringState2String(this.monitoringState));
        if (area.armState !== ARM_TYPE.DISARMED) {
          if (sensor.alert) {
            this.alertService.createAlert([sensor], ALERT_TYPE.STAY);
          }
        }
      }, 1000 * zone.stayAlertDelay);
    } else if (area.armState === ARM_TYPE.DISARMED && zone.disarmedDelay != null && sensor.enabled) {
      // NO DELAY OF SABOTAGE
      setTimeout(() => {
        this.alertService.createAlert([sensor], ALERT_TYPE.SABOTAGE);
      }, 1000 * zone.disarmedDelay);
    } else if (area.armState !== ARM_TYPE.DISARMED) {
      console.error("Can't alert system!!!");
    }
  }

  stopAlert(sensor: Sensor) {
    const armService = this.injector.get(ArmService);
    armService.stopAlert(sensor);
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
