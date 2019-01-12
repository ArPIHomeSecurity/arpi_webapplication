import { Injectable } from '@angular/core';
import { Observable ,  timer, BehaviorSubject } from 'rxjs';

import { Alert, MonitoringState, ArmType } from '../models';


@Injectable()
export class EventService {

  private _alertStateSubject = new BehaviorSubject<Alert>(null);
  private _alertState = this._alertStateSubject.asObservable();

  private _armStateSubject = new BehaviorSubject<ArmType>(ArmType.DISARMED);
  private _armState = this._armStateSubject.asObservable();

  private _monitoringStateSubject = new BehaviorSubject<MonitoringState>(MonitoringState.READY);
  private _monitoringState = this._monitoringStateSubject.asObservable();

  private _sensorStateSubject = new BehaviorSubject<boolean>(false);
  private _sensorState = this._sensorStateSubject.asObservable();

  private _syrenStateSubject = new BehaviorSubject<boolean>(null);
  private _syrenState = this._syrenStateSubject.asObservable();

  constructor() {

  }

  listen(event: string): Observable<any> {
    let subject: any;
    if (event === 'system_state_change') {
      subject = this._monitoringState;
    } else if (event === 'arm_state_change') {
      subject = this._armState;
    } else if (event === 'alert_state_change') {
      subject = this._alertState;
    } else if (event === 'sensors_state_change') {
      subject = this._sensorState;
    } else if (event === 'syren_state_change') {
      subject = this._syrenState;
    } else {
      console.log('Unknown event: ', event);
    }

    return subject;
  }

  updateAlertState(alert: Alert) {
    this._alertStateSubject.next(alert);
  }

  updateArmState(state: ArmType) {
    this._armStateSubject.next(state);
  }

  updateMonitoringState(state: MonitoringState) {
    this._monitoringStateSubject.next(state);
  }

  updateSensorState(state: boolean) {
    this._sensorStateSubject.next(state);
  }

  updateSyrenState(state: boolean) {
    this._syrenStateSubject.next(state);
  }
}
