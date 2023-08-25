import { Injectable } from '@angular/core';
import { Observable , Subject } from 'rxjs';
import { delay } from 'rxjs/operators';

import { Alert, Area } from '../../models';
import { environment } from '../../../environments/environment';


@Injectable()
export class EventService {

  alertDelayed: boolean;
  private alertStateSubject = new Subject<Alert>();
  private alertState = this.alertStateSubject.asObservable().pipe(delay(environment.delay));

  private armStateSubject = new Subject<string>();
  private armState = this.armStateSubject.asObservable().pipe(delay(environment.delay));

  private areaStateSubject = new Subject<Area>();
  private areaState = this.areaStateSubject.asObservable().pipe(delay(environment.delay));

  private monitoringStateSubject = new Subject<string>();
  private monitoringState = this.monitoringStateSubject.asObservable().pipe(delay(environment.delay));

  private sensorsStateSubject = new Subject<boolean>();
  private sensorsState = this.sensorsStateSubject.asObservable().pipe(delay(environment.delay));

  private syrenStateSubject = new Subject<boolean>();
  private syrenState = this.syrenStateSubject.asObservable().pipe(delay(environment.delay));

  private powerStateSubject = new Subject<boolean>();
  private powerState = this.powerStateSubject.asObservable().pipe(delay(environment.delay));

  private connectionStateSubject = new Subject<boolean>();
  private connectionState = this.connectionStateSubject.asObservable();

  private cardRegisteredStateSubject = new Subject<boolean>();
  private cardRegisteredState = this.cardRegisteredStateSubject.asObservable();

  constructor() {
    this.connectionStateSubject.next(true);
  }

  isConnected(): Observable<boolean> {
    return this.connectionState;
  }

  listen(event: string): Observable<any> {
    let subject: any;
    if (event === 'system_state_change') {
      subject = this.monitoringState;
    } else if (event === 'arm_state_change') {
      subject = this.armState;
    } else if (event === 'area_state_change') {
      subject = this.areaState;
    } else if (event === 'alert_state_change') {
      subject = this.alertState;
    } else if (event === 'sensors_state_change') {
      subject = this.sensorsState;
    } else if (event === 'syren_state_change') {
      subject = this.syrenState;
    } else if (event === 'power_state_change') {
      subject = this.powerState;
    } else if (event === 'card_registered') {
      subject = this.cardRegisteredState;
    } else if (['connect', 'disconnect'].includes(event)) {
      subject = this.connectionState;
    } else {
      console.warn('Unknown event: ', event);
    }

    return subject;
  }

  updateAlertState(alert: Alert) {
    this.alertStateSubject.next(alert);
  }

  updateArmState(state: string) {
    this.armStateSubject.next(state);
  }

  updateAreaState(area: Area) {
    this.areaStateSubject.next(area);
  }

  updateMonitoringState(state: string) {
    this.monitoringStateSubject.next(state);
  }

  updateSensorsState(state: boolean) {
    this.sensorsStateSubject.next(state);
  }

  updateSyrenState(state: boolean) {
    this.syrenStateSubject.next(state);
  }

  updateCardState(state: boolean = true) {
    this.cardRegisteredStateSubject.next(state);
  }
}
