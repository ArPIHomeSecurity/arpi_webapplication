
import {map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';


import { ArmType, Alert, String2ArmType } from '../models/index';
import { environment } from '../../environments/environment';

@Injectable()
export class AlertService {

  alerts: Alert[] = [];
  constructor(
    private http: HttpClient
  ) { }

  getAlerts(): Observable<Alert[]> {
    // get sensors from api
    // hack: converting arm_type field from string to ArmType
    return this.http.get<Alert[]>( '/api/alerts', { } ).pipe(
      map(( rawAlerts: Object[] ) => {
        for ( const rawAlert of rawAlerts ) {
          rawAlert['arm_type'] = String2ArmType( rawAlert['arm_type'] );
        }
        return rawAlerts as Alert[];
      } ));
  }


  getAlert(): Observable<Alert> {
    // get sensors from api
    return of(null);
  }
}
