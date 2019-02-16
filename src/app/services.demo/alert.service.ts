
import {map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
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
    return of(this.alerts).delay(environment.delay);
  }


  getAlert(): Observable<Alert> {
    // get sensors from api
    return of(this.alerts.find(a => a.end_time != null)).delay(environment.delay);
  }

  _createAlert(sensors: Sensor[], armType: ArmType) {
    const alert: Alert = {
      id: this.alerts.length + 1,
      start_time: new Date(),
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
      alert.end_time = new Date();
      setSessionValue('AlertService.alerts', this.alerts);
      this.eventService._updateAlertState(null);
    }
  }
}
