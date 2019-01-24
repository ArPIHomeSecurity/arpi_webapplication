
import {map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';


import { ArmType, Alert, String2ArmType, Sensor } from '../models/index';
import { environment, ALERTS } from '../../environments/environment';
import { EventService } from '../services/event.service';

@Injectable()
export class AlertService {

  alerts: Alert[] = ALERTS;
  constructor(
    private eventService: EventService
  ) { }

  getAlerts(): Observable<Alert[]> {
    return of(this.alerts);
  }


  getAlert(): Observable<Alert> {
    // get sensors from api
    return of(this.alerts.find(a => a.end_time != null));
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
    this.eventService._updateAlertState(alert);
  }

  _stopAlert() {
    const alert = this.alerts.find(a => a.end_time == null);
    if (alert != null) {
      alert.end_time = new Date();
      this.eventService._updateAlertState(null);
    }
  }
}
