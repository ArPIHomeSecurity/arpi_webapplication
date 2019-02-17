
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';


import { ArmType, Alert, Sensor } from '../models';
import { environment, ALERTS } from '../../environments/environment';
import { EventService } from '../services/event.service';
import { getSessionValue, setSessionValue } from '../utils';

@Injectable()
export class AlertService {

  alerts: Alert[];

  // true=syren / false=syren muted / null=no syren
  syren: boolean;
  syrenId: number;

  constructor(
    private eventService: EventService
  ) {
    this.alerts = getSessionValue('AlertService.alerts', ALERTS);
    this.syren = getSessionValue('AlertService.syren', null);
    this.syrenId = getSessionValue('AlertService.syrenId', null);

    clearInterval(this.syrenId);

    if (this.syren != null) {
      this._startSyren();
    }
  }

  getAlerts(): Observable<Alert[]> {
    const sortedAlerts = this.alerts.sort((a1, a2) => {
      if (a1.start_time < a2.start_time) {
        return 1;
      }
      if (a1.start_time > a2.start_time) {
        return -1;
      }
      return 0;
    });
    return of(sortedAlerts).delay(environment.delay);
  }


  getAlert(): Observable<Alert> {
    // get sensors from api
    return of(this.alerts.find(a => a.end_time === null)).delay(environment.delay);
  }

  _createAlert(sensors: Sensor[], armType: ArmType) {
    const alert: Alert = {
      id: this.alerts.length + 1,
      start_time: new Date().toISOString(),
      end_time: null,
      arm_type: armType,
      sensors: sensors
    };
    this.alerts.push(alert);
    this.syren = true;
    setSessionValue('AlertService.alerts', this.alerts);
    setSessionValue('AlertService.syren', this.syren);
    this.eventService._updateAlertState(alert);
    this.eventService._updateSyrenState(this.syren);
    this._startSyren();
  }

  _startSyren() {
    this.syrenId = window.setInterval(() => {
      this.syren = !this.syren;
      this.eventService._updateSyrenState(this.syren);
    }, 5000);
    setSessionValue('AlertService.syrenId', this.syrenId);
  }

  _stopAlert() {
    const alert = this.alerts.find(a => a.end_time == null);
    if (alert != null) {
      alert.end_time = new Date().toISOString();
      this.syren = null;
      clearInterval(this.syrenId);
      setSessionValue('AlertService.alerts', this.alerts);
      setSessionValue('AlertService.syren', this.syren);
      this.eventService._updateAlertState(null);
      this.eventService._updateSyrenState(this.syren);
    }
  }
}
