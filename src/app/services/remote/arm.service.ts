import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Arm, ArmEvent, armType2String, ARM_TYPE, string2AlertType, string2ArmType } from '../../models';

function formatDate(date: Date) {
  const year = date.toLocaleString('default', {year: 'numeric'}).replace('.','');
  const month = date.toLocaleString('default', {month: '2-digit'});
  const day = date.toLocaleString('default', {day: '2-digit'});

  return [year, month, day].join('-');
}

@Injectable()
export class ArmService implements ArmService {

  constructor(
    private http: HttpClient
  ) { }

  getArms(armType: ARM_TYPE, userId: number, startDate: Date, endDate: Date, hasAlert: boolean, offset: number, limit: number): Observable<ArmEvent[]> {
    // get arms from api
    // hack: converting alert field from string to AlertType
    let params = new HttpParams()
      .set('has_alert', hasAlert)
      .set('offset', offset)
      .set('limit', limit);

    if (armType != ARM_TYPE.UNDEFINED) {
      params = params.append('arm_type', armType2String(armType));
    }

    if (userId == -1) {
      params = params.append('keypad_id', 1);
    }
    else if (userId != 0) {
      params = params.append('user_id', userId);
    }

    if (startDate != null) {
      params = params.append('start', formatDate(startDate));
    }
    if (endDate != null) {
      params = params.append('end', formatDate(endDate));
    }

    return this.http.get<ArmEvent[]>('/api/events', { params }).pipe(
      map(( rawArmEvents: any[] ) => {
        for ( const rawArmEvent of rawArmEvents ) {
          if (rawArmEvent.arm) {
            rawArmEvent.arm.type = string2ArmType( rawArmEvent.arm.type );
          }

          if (rawArmEvent.alert) {
            rawArmEvent.alert.alertType = string2AlertType( rawArmEvent.alert.alertType );
          }
        }
        return rawArmEvents as ArmEvent[];
      } ));
  }

  getArmsCount(armType: ARM_TYPE, userId: number, startDate: Date, endDate: Date, hasAlert: boolean): Observable<number> {
    let params = new HttpParams()
      .set('has_alert', hasAlert);

    if (armType != ARM_TYPE.UNDEFINED) {
      params = params.append('arm_type', armType2String(armType));
    }

    if (userId == -1) {
      params = params.append('keypad_id', 1);
    }
    else if (userId != 0) {
      params = params.append('user_id', userId);
    }

    if (startDate != null) {
      params = params.append('start', formatDate(startDate));
    }
    if (endDate != null) {
      params = params.append('end', formatDate(endDate));
    }

    return this.http.get<number>('/api/events/count', { params });
  }

  getArm(): Observable<Arm> {
    // get sensors from api
    return this.http.get<Arm>('/api/arm');
  }
}
