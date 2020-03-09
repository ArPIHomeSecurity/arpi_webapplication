
import {map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


import { Alert, String2AlertType } from '../models';


@Injectable()
export class AlertService {

  constructor(
    private http: HttpClient
  ) { }

  getAlerts(): Observable<Alert[]> {
    // get sensors from api
    // hack: converting arm_type field from string to ArmType
    return this.http.get<Alert[]>('/api/alerts').pipe(
      map(( rawAlerts: Object[] ) => {
        for ( const rawAlert of rawAlerts ) {
          rawAlert['alert_type'] = String2AlertType( rawAlert['alert_type'] );
        }
        return rawAlerts as Alert[];
      } ));
  }


  getAlert(): Observable<Alert> {
    // get sensors from api
    return this.http.get<Alert>('/api/alert');
  }
}
