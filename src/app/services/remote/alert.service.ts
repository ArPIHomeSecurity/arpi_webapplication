import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Alert, string2AlertType } from '@app/models';


@Injectable()
export class AlertService implements AlertService {

  constructor(
    private http: HttpClient
  ) { }

  getAlerts(): Observable<Alert[]> {
    // get sensors from api
    // hack: converting arm_type field from string to ArmType
    return this.http.get<Alert[]>('/api/alerts').pipe(
      map(( rawAlerts: any[] ) => {
        for ( const rawAlert of rawAlerts ) {
          rawAlert.alertType = string2AlertType( rawAlert.alertType );
        }
        return rawAlerts as Alert[];
      } ));
  }


  getAlert(): Observable<Alert> {
    // get sensors from api
    return this.http.get<Alert>('/api/alert');
  }
}
