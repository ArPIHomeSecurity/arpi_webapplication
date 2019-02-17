
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';


import { ArmType, Alert, Sensor } from '../models';
import { environment, ALERTS } from '../../environments/environment';
import { EventService } from '../services/event.service';
import { getSessionValue, setSessionValue } from '../utils';

@Injectable()
export class AlertService {

  alerts: Alert[];
  constructor(
    private eventService: EventService
  ) {
    this.alerts = getSessionValue('AlertService.alerts', ALERTS);
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
    setSessionValue('AlertService.alerts', this.alerts);
    this.eventService._updateAlertState(alert);
  }

  _stopAlert() {
    const alert = this.alerts.find(a => a.end_time == null);
    if (alert != null) {
      alert.end_time = new Date().toISOString();
      setSessionValue('AlertService.alerts', this.alerts);
      this.eventService._updateAlertState(null);
    }
  }
}
