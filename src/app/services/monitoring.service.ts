import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

import { ArmType } from '../models/index';
import { AuthenticationService } from '../services/authentication.service';
import { environment } from '../../environments/environment';



export enum MonitoringState {
  NOT_READY = 0,
  STARTUP = 1,
  READY = 2,
  UPDATING_CONFIG = 3,
  INVALID_CONFIG = 4,
  ARMED = 5,
  SABOTAGE = 6
}

export function getMonitoringStateFromString(systemState: string): MonitoringState {
  switch (systemState) {
    case environment.MONITORING_READY:
      return MonitoringState.READY;
    case environment.MONITORING_UPDATING_CONFIG:
      return MonitoringState.UPDATING_CONFIG;
    case environment.MONITORING_INVALID_CONFIG:
      return MonitoringState.INVALID_CONFIG;
    case environment.MONITORING_SABOTAGE:
      return MonitoringState.SABOTAGE;
    case environment.MONITORING_STARTUP:
      return MonitoringState.STARTUP;
    case environment.MONITORING_ARMED:
      return MonitoringState.ARMED;
    default:
      console.error('Unknown monitoring state!!!' + systemState);
  }
}

@Injectable()
export class MonitoringService {

  constructor(
      private http: Http,
      private authService: AuthenticationService
      ) {}

  is_alert(): Observable<boolean> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});

    const options = new RequestOptions({headers: headers});

    return this.http.get('/api/monitoring/isAlert', options)
      .map((response: Response) => response.json()
    ).catch ((err: Response) => {
        console.log(err);
        return Observable.throw({description: 'Error Value Emitted'});
    });
  }

  getArmState(): Observable<ArmType> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});

    const options = new RequestOptions({headers: headers});

    return this.http.get('/api/monitoring/getArm', options)
      .map((response: Response) => {
        switch (response.json().type) {
          case environment.ARM_AWAY:
            return ArmType.AWAY;
          case environment.ARM_STAY:
            return ArmType.STAY;
          case environment.ARM_DISARM:
            return ArmType.DISARMED;
          default:
            console.error('Unknown arm type!!!' + response.json());
        }
      }
    ).catch ((err: Response) => {
        console.log(err);
        return Observable.throw({description: 'Error Value Emitted'});
    });
  }

  arm(armtype: ArmType) {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});

    const params: URLSearchParams = new URLSearchParams();
    if (armtype === ArmType.AWAY) {
      params.set('type', environment.ARM_AWAY);
    }
    if (armtype === ArmType.STAY) {
      params.set('type', environment.ARM_STAY);
    }

    const options = new RequestOptions({headers: headers, params: params});

    this.http.put('/api/monitoring/arm', null, options)
      .map((response: Response) => response.json())
      .catch ((err: Response) => {
        console.log(err);
        return Observable.throw({description: 'Error Value Emitted'});
      })
      .subscribe();
  }

  disarm() {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});

    const options = new RequestOptions({headers: headers});

    return this.http.put('/api/monitoring/disarm', null, options)
      .map((response: Response) => response.json())
      .catch ((err: Response) => {
        console.log(err);
        return Observable.throw({description: 'Error Value Emitted'});
      })
      .subscribe();
  }

  getMonitoringState(): Observable<MonitoringState> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});

    const options = new RequestOptions({headers: headers});

    return this.http.get('/api/monitoring/getState', options)
      .map((response: Response) => getMonitoringStateFromString(response.json().state))
      .catch ((err: Response) => {
        console.log(err);
        return Observable.throw({description: 'Error Value Emitted'});
    });
  }
}
