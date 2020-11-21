import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';

import { AuthenticationService } from './authentication.service';
import { EventService } from './event.service';

import { ALERT_TYPE, Alert, Sensor, AlertSensor } from 'src/app/models';
import { ALERTS } from 'src/app/demo/configuration';
import { getSessionValue, setSessionValue } from 'src/app/utils';
import { environment } from 'src/environments/environment';


@Injectable()
export class AlertService {

  alerts: Alert[];

  // true=syren / false=syren muted / null=no syren
  syren: boolean;
  syrenId: number;

  constructor(
    @Inject('AuthenticationService') private authService: AuthenticationService,
    @Inject('EventService') private eventService: EventService
  ) {
    this.alerts = getSessionValue('AlertService.alerts', ALERTS);
    this.syren = getSessionValue('AlertService.syren', null);
    this.syrenId = getSessionValue('AlertService.syrenId', null);

    clearInterval(this.syrenId);

    if (this.syren != null) {
      this.startSyren();
    }
  }

  getAlerts(): Observable<Alert[]> {
    const sortedAlerts = this.alerts.sort((a1, a2) => {
      if (a1.startTime < a2.startTime) {
        return 1;
      }
      if (a1.startTime > a2.startTime) {
        return -1;
      }
      return 0;
    });
    return of(sortedAlerts)
      .pipe(
        delay(environment.delay),
        map(_ => {
          this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }


  getAlert(): Observable<Alert> {
    // get sensors from api
    return of(this.alerts.find(a => a.endTime === null)).pipe(delay(environment.delay));
  }

  createAlert(sensors: Sensor[], alertType: ALERT_TYPE) {
    const alertSensors: AlertSensor[] = [];
    sensors.forEach(sensor => {
      alertSensors.push({
        sensorId: sensor.id,
        typeId: sensor.typeId,
        channel: sensor.channel,
        description: sensor.description
      });
    });

    const alert: Alert = {
      id: this.alerts.length + 1,
      startTime: new Date().toLocaleString(),
      endTime: null,
      alertType,
      sensors: alertSensors
    };
    this.alerts.push(alert);
    this.syren = true;
    setSessionValue('AlertService.alerts', this.alerts);
    setSessionValue('AlertService.syren', this.syren);
    this.eventService.updateAlertState(alert);
    this.eventService.updateSyrenState(this.syren);
    this.startSyren();
  }

  startSyren() {
    this.syrenId = window.setInterval(() => {
      this.syren = !this.syren;
      this.eventService.updateSyrenState(this.syren);
    }, 5000);
    setSessionValue('AlertService.syrenId', this.syrenId);
  }

  stopAlert() {
    const alert = this.alerts.find(a => a.endTime == null);
    if (alert != null) {
      alert.endTime = new Date().toLocaleString();
      this.syren = null;
      clearInterval(this.syrenId);
      setSessionValue('AlertService.alerts', this.alerts);
      setSessionValue('AlertService.syren', this.syren);
      this.eventService.updateAlertState(null);
      this.eventService.updateSyrenState(this.syren);
    }
  }
}
