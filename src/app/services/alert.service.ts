import { Injectable} from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { ArmType, Alert } from '../models/index';
import { AuthenticationService } from '../services/authentication.service';
import { environment } from '../../environments/environment';

@Injectable()
export class AlertService {

  constructor(
      private http: Http,
      private authService: AuthenticationService
  ) { }

  getAlerts(): Observable<Alert[]> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});

    const options = new RequestOptions({headers: headers});

    // get sensors from api
    return this.http.get('/api/alerts', options)
      .map((response: Response) => {
          var alerts = response.json();
          for (let alert of alerts) {
            // convert arm type from monitoring string to ArmType enum
            switch (alert.arm_type) {
              case environment.ARM_AWAY:
                alert.arm_type = ArmType.AWAY
                break;
              case environment.ARM_STAY:
                alert.arm_type = ArmType.STAY
                break;
              case environment.ARM_DISARM:
                alert.arm_type = ArmType.DISARMED;
                break;
              default:
                console.error('Unknown arm type!', alert.arm_type);
            }
          }

          return alerts;
      });
  }


  getAlert(): Observable<Alert> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

    // get sensors from api
    return this.http.get('/api/alert', options)
      .map((response: Response) => response.json());
  }
}
