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

  private _sensorsStateSubject = new BehaviorSubject<boolean>(false);
  private _sensorsState = this._sensorsStateSubject.asObservable();

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
      subject = this._sensorsState;
    } else if (event === 'syren_state_change') {
      subject = this._syrenState;
    } else {
      console.log('Unknown event: ', event);
    }

    return subject;
  }

  _updateAlertState(alert: Alert) {
    this._alertStateSubject.next(alert);
  }

  _updateArmState(state: ArmType) {
    this._armStateSubject.next(state);
  }

  _updateMonitoringState(state: MonitoringState) {
    this._monitoringStateSubject.next(state);
  }

  _updateSensorsState(state: boolean) {
    this._sensorsStateSubject.next(state);
  }

  _updateSyrenState(state: boolean) {
    this._syrenStateSubject.next(state);
  }
}
