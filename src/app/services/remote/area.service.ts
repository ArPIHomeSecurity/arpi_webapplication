import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ARM_TYPE, Area, armType2String, string2ArmType } from '../../models';


@Injectable()
export class AreaService {

  constructor(
    private http: HttpClient
  ) { }

  getAreas(): Observable<Area[]> {
    // get areas from api
    return this.http.get<Area[]>('/api/areas/').pipe(
      map((rawAreas: any[]) => {
        for (const rawArea of rawAreas) {
          rawArea.armState = string2ArmType(rawArea.armState);
        }
        return rawAreas as Area[];
      }));
  }

  getArea(areaId: number): Observable<Area> {
    // get sensors from api
    return this.http.get<Area>('/api/area/' + areaId);
  }

  createArea(area: Area): Observable<Area> {
    // convert arm state to string
    const data: Object = area;
    data["armState"] = armType2String(area.armState);
    return this.http.post<Area>('/api/areas/', data);
  }

  updateArea(area: Area): Observable<Area> {
    // set sensor from api
    return this.http.put<Area>('/api/area/' + area.id, area);
  }

  deleteArea(areaId: number): Observable<boolean> {
    // set sensor from api
    return this.http.delete<boolean>('/api/area/' + areaId);
  }

  arm(areaId: number, armtype: ARM_TYPE): Observable<Object> {
    let params = new HttpParams()
      .set('type', armType2String(armtype))
      .set('area_id', areaId)

    return this.http.put<Area[]>('/api/area/arm', null, { params });
  }

  disarm(areaId: number): Observable<Object> {
    let params = new HttpParams()
      .set('area_id', areaId)

    return this.http.put('/api/area/disarm', null, { params });
  }
}
